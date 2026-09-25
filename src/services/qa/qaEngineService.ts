import { createClient } from "@/utils/supabase/server";
import { callGeminiWithFallback } from "@/utils/gemini";
import { initResilientDns } from "@/utils/resilientDns";
import { buildApplicationQAContext, QAAuthorizationError, QANotFoundError } from "./qaContextBuilder";

initResilientDns();
import { getOrCreateQAWorkspace } from "./qaWorkspaceService";
import { buildQAPrompt } from "./qaPromptBuilder";
import { QAGenerationOutputSchema, type QAGenerationOutput } from "./qaSchemas";
import type { 
  QAWorkspace, 
  QAStage, 
  QAQuestion, 
  QAAnswer, 
  QAClarification, 
  QAStageType 
} from "@shared/types/qa";

export class QAGenerationInProgressError extends Error {
  constructor(message = "A preparation generation is already in progress for this application") {
    super(message);
    this.name = "QAGenerationInProgressError";
    Object.setPrototypeOf(this, QAGenerationInProgressError.prototype);
  }
}

export class QAInvalidAIOutputError extends Error {
  constructor(message = "The AI generation output could not be validated against the required schema") {
    super(message);
    this.name = "QAInvalidAIOutputError";
    Object.setPrototypeOf(this, QAInvalidAIOutputError.prototype);
  }
}

export class QAGenerationFailedError extends Error {
  constructor(message = "Failed to generate interview preparation questions") {
    super(message);
    this.name = "QAGenerationFailedError";
    Object.setPrototypeOf(this, QAGenerationFailedError.prototype);
  }
}

export interface PreparedQAResult {
  workspace: QAWorkspace;
  stage: QAStage;
  questions: (QAQuestion & { answer: QAAnswer | null })[];
  clarifications: QAClarification[];
  isCached: boolean;
}

/**
 * Parses and validates raw Gemini text response against QAGenerationOutputSchema.
 * Automatically cleans code blocks and extracts json boundaries.
 */
export function parseAndValidateAIResponse(rawContent: string): QAGenerationOutput {
  let cleaned = rawContent.trim();
  
  // Remove markdown codeblock wrapping if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  let parsedJson: any;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch (err: any) {
    throw new QAInvalidAIOutputError(`JSON parse error: ${err.message}`);
  }

  const validationResult = QAGenerationOutputSchema.safeParse(parsedJson);
  if (!validationResult.success) {
    const issues = validationResult.error.issues || (validationResult.error as any).errors || [];
    const errorDetails = issues.length > 0
      ? issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("; ")
      : validationResult.error.message;
    throw new QAInvalidAIOutputError(`Schema validation failed: ${errorDetails}`);
  }

  return validationResult.data;
}

async function withDbRetry<T>(operation: () => Promise<T>, description: string): Promise<T> {
  let attempts = 0;
  const maxAttempts = 3;
  while (attempts < maxAttempts) {
    attempts++;
    try {
      return await operation();
    } catch (err: any) {
      if (attempts < maxAttempts) {
        console.warn(`[QA Engine DB] ${description} attempt ${attempts} warning: ${err?.message || err}. Retrying in ${attempts * 400}ms...`);
        await new Promise((r) => setTimeout(r, attempts * 400));
        continue;
      }
      throw err;
    }
  }
  return await operation();
}

/**
 * Core Intelligence Engine: Prepares an application for interview Q&A.
 * Gathers authoritative context, prevents race conditions, invokes Gemini,
 * validates output, and atomically persists normalized records.
 */
export async function prepareApplicationQA(
  applicationId: string,
  authenticatedUserId: string,
  options: {
    stageType?: QAStageType;
    forceRegenerate?: boolean;
    customSupabaseClient?: any;
    mockGeminiRunner?: (prompt: string) => Promise<string>;
  } = {}
): Promise<PreparedQAResult> {
  const supabase = options.customSupabaseClient || (await createClient());
  const targetStageType: QAStageType = options.stageType || "application";
  const forceRegenerate = options.forceRegenerate || false;
  const genStartTime = Date.now();

  // Check centralized feature flags
  const { getQASettings } = await import("../admin/qaSettingsService");
  const settings = await getQASettings();
  if (!settings.is_qa_enabled) {
    throw new Error("Q&A Preparation is temporarily undergoing maintenance. Please try again shortly.");
  }

  // 1. Build and verify authoritative application context (IDOR protection)
  const context = await buildApplicationQAContext(applicationId, authenticatedUserId, supabase);

  // 2. Resolve or create QA Workspace
  const { workspace } = await getOrCreateQAWorkspace(applicationId, authenticatedUserId, supabase);

  // 3. Concurrency / In-Progress lock check (lock window: 2 minutes)
  const now = Date.now();
  const lastUpdated = new Date(workspace.updated_at).getTime();
  const isCurrentlyPreparing = workspace.status === "preparing" || workspace.status === "regenerating";

  if (isCurrentlyPreparing && now - lastUpdated < 120000 && !forceRegenerate) {
    throw new QAGenerationInProgressError();
  }

  // 4. Resolve Stage record
  let { data: stage } = await supabase
    .from("qa_preparation_stages")
    .select("*")
    .eq("workspace_id", workspace.id)
    .eq("stage_type", targetStageType)
    .maybeSingle();

  if (!stage) {
    const { data: newStage, error: stageInsertError } = await supabase
      .from("qa_preparation_stages")
      .insert({
        workspace_id: workspace.id,
        user_id: authenticatedUserId,
        stage_type: targetStageType,
        stage_order: 1,
        title: `${targetStageType.charAt(0).toUpperCase() + targetStageType.slice(1).replace(/_/g, " ")} Preparation`,
        status: "not_started",
      })
      .select()
      .single();

    if (stageInsertError) {
      throw new Error(`Failed to create stage: ${stageInsertError.message}`);
    }
    stage = newStage;
  }

  // 5. Stale / Cache check: If ready, not stale, not forced, and questions exist, return cached
  if (workspace.status === "ready" && !workspace.is_stale && !forceRegenerate) {
    const { data: existingQuestions } = await supabase
      .from("qa_questions")
      .select(`
        *,
        answer:qa_answers(*)
      `)
      .eq("stage_id", stage.id)
      .order("order_index", { ascending: true });

    if (existingQuestions && existingQuestions.length > 0) {
      const { data: existingClarifications } = await supabase
        .from("qa_clarifications")
        .select("*")
        .eq("workspace_id", workspace.id);

      return {
        workspace,
        stage,
        questions: existingQuestions.map((q: any) => ({
          ...q,
          answer: Array.isArray(q.answer) ? q.answer[0] || null : q.answer || null,
        })),
        clarifications: existingClarifications || [],
        isCached: true,
      };
    }
  }

  // 6. Transition workspace status to 'preparing' / 'regenerating'
  const newStatus = workspace.status === "ready" ? "regenerating" : "preparing";
  await supabase
    .from("application_qa_workspaces")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workspace.id);

  try {
    // 7. Construct Prompt with context minimization & injection boundaries
    const prompt = buildQAPrompt(context, targetStageType);

    // 8. Invoke Gemini with model fallback & JSON mode
    let rawResponse: string;
    if (options.mockGeminiRunner) {
      rawResponse = await options.mockGeminiRunner(prompt);
    } else {
      rawResponse = await callGeminiWithFallback(prompt, {
        responseMimeType: "application/json",
      });
    }

    // 9. Parse and validate AI output
    let validatedOutput: QAGenerationOutput;
    try {
      validatedOutput = parseAndValidateAIResponse(rawResponse);
    } catch (parseErr: any) {
      console.warn(`[QA Engine] First parse attempt failed: ${parseErr.message}. Attempting single repair...`);
      // Retry once with repair prompt
      const repairPrompt = `
You previously returned an invalid JSON response for interview preparation.
Error: ${parseErr.message}

Please fix the error and output ONLY the valid JSON matching the exact schema.

Original Request:
${prompt}
      `.trim();

      const repairedResponse = options.mockGeminiRunner
        ? await options.mockGeminiRunner(repairPrompt)
        : await callGeminiWithFallback(repairPrompt, { responseMimeType: "application/json" });

      validatedOutput = parseAndValidateAIResponse(repairedResponse);
    }

    // 10. Atomic Database Persistence
    // Clean existing questions for this stage (cascades to answers and practice attempts)
    await supabase
      .from("qa_questions")
      .delete()
      .eq("stage_id", stage.id);

    // Insert new Questions
    const questionsToInsert = validatedOutput.questions.map((q, idx) => ({
      stage_id: stage.id,
      workspace_id: workspace.id,
      user_id: authenticatedUserId,
      question_text: q.questionText,
      category: q.category,
      priority: q.priority,
      risk_level: q.riskLevel,
      what_employer_means: q.whatEmployerMeans,
      order_index: idx + 1,
      is_user_reported: false,
      source_provenance: {
        model: "gemini",
        generatedAt: new Date().toISOString(),
        promptVersion: "v1.0",
        sourceHash: context.sourceHash,
      },
    }));

    const insertedQuestions = await withDbRetry(async () => {
      const { data, error: qInsertError } = await supabase
        .from("qa_questions")
        .insert(questionsToInsert)
        .select();

      if (qInsertError || !data) {
        throw new Error(`Failed to persist questions: ${qInsertError?.message}`);
      }
      return data;
    }, "Persist questions");

    // 10. Run Truth Lock Claim Verification against Application Memory
    let appMemory: any = null;
    try {
      const { buildApplicationMemory } = await import("./applicationMemoryService");
      appMemory = await buildApplicationMemory(applicationId, authenticatedUserId, supabase);
    } catch (memErr) {
      console.warn("[QA Engine] Application Memory reconstruction warning:", memErr);
    }

    const { verifyAnswerClaims } = await import("./truthLockService");

    // Insert Answers corresponding to each question
    const answersToInsert = insertedQuestions.map((iq: any, idx: number) => {
      const qOutput = validatedOutput.questions[idx];
      const answerContent = qOutput.suggestedNormal || qOutput.suggestedQuick || "";
      
      let verificationDetails = null;
      let claimsPayload = null;
      let finalTruthStatus = qOutput.truthStatus || "verified";

      if (appMemory && answerContent) {
        verificationDetails = verifyAnswerClaims(answerContent, appMemory, {
          questionCategory: qOutput.category as any,
          evidenceReferences: qOutput.evidenceReferences,
        });
        claimsPayload = verificationDetails.claims;
        if (verificationDetails.overallStatus === "conflict" || verificationDetails.overallStatus === "needs_clarification") {
          finalTruthStatus = verificationDetails.overallStatus;
        }
      }

      return {
        question_id: iq.id,
        user_id: authenticatedUserId,
        suggested_quick: qOutput.suggestedQuick || null,
        suggested_normal: qOutput.suggestedNormal || null,
        suggested_detailed: qOutput.suggestedDetailed || null,
        active_version: "normal",
        answer_anchors: qOutput.answerAnchors || [],
        truth_status: finalTruthStatus,
        verification_details: verificationDetails,
        claims_payload: claimsPayload,
        provenance: {
          strategy: qOutput.answerStrategy,
          references: qOutput.evidenceReferences,
          relevanceRationale: qOutput.relevanceRationale,
        },
      };
    });

    const insertedAnswers = await withDbRetry(async () => {
      const { data, error: aInsertError } = await supabase
        .from("qa_answers")
        .insert(answersToInsert)
        .select();

      if (aInsertError || !data) {
        throw new Error(`Failed to persist answers: ${aInsertError?.message}`);
      }
      return data;
    }, "Persist answers");

    // Insert any pending clarifications for questions that need clarification
    const clarificationsToInsert: any[] = [];
    validatedOutput.questions.forEach((q, idx) => {
      if (q.truthStatus === "needs_clarification" && q.clarificationTopic) {
        const questionId = insertedQuestions[idx]?.id || null;
        clarificationsToInsert.push({
          workspace_id: workspace.id,
          question_id: questionId,
          user_id: authenticatedUserId,
          topic: q.clarificationTopic,
          question_prompt: q.clarificationPrompt || `Please clarify your experience with ${q.clarificationTopic}`,
          clarification_type: "yes_no_little",
          allowed_options: ["yes", "no", "a_little"],
          scope: "application",
          status: "pending",
        });
      }
    });

    let insertedClarifications: QAClarification[] = [];
    if (clarificationsToInsert.length > 0) {
      insertedClarifications = await withDbRetry(async () => {
        const { data: cData, error: cError } = await supabase
          .from("qa_clarifications")
          .insert(clarificationsToInsert)
          .select();
        if (cError) {
          throw new Error(`Failed to persist clarifications: ${cError.message}`);
        }
        return cData || [];
      }, "Persist clarifications");
    }

    // 11. Finalize Workspace & Stage Records
    const { data: updatedWorkspace, error: wsUpdateError } = await supabase
      .from("application_qa_workspaces")
      .update({
        status: "ready",
        readiness_score: validatedOutput.readinessScore,
        source_hash: context.sourceHash,
        is_stale: false,
        stale_reason: null,
        last_prepared_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", workspace.id)
      .select()
      .single();

    if (wsUpdateError) {
      throw new Error(`Failed to update workspace status: ${wsUpdateError.message}`);
    }

    const { data: updatedStage } = await supabase
      .from("qa_preparation_stages")
      .update({
        status: "in_progress",
        readiness_score: validatedOutput.readinessScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stage.id)
      .select()
      .single();

    // Assemble joined response
    const questionsWithAnswers = insertedQuestions.map((q: any, idx: number) => ({
      ...q,
      answer: insertedAnswers[idx] || null,
    }));

    // Record Success Telemetry
    try {
      const latencyMs = Date.now() - genStartTime;
      const { recordGenerationTelemetry } = await import("../admin/qaTelemetryService");
      await recordGenerationTelemetry({
        workspaceId: workspace.id,
        applicationId,
        userId: authenticatedUserId,
        feature: forceRegenerate ? "regenerate" : "prepare",
        status: "success",
        latencyMs,
        promptTokens: Math.round(prompt.length / 4),
        completionTokens: Math.round(rawResponse.length / 4),
        modelName: settings.active_gemini_model || "gemini-3.8-flash",
        platform: "web",
      });
    } catch (telemetryErr) {
      console.warn("[QA Engine] Telemetry log warning:", telemetryErr);
    }

    return {
      workspace: updatedWorkspace || workspace,
      stage: updatedStage || stage,
      questions: questionsWithAnswers,
      clarifications: insertedClarifications,
      isCached: false,
    };
  } catch (err: any) {
    console.error(`[QA Engine] Generation failed for application ${applicationId}:`, err.message);

    // Record Failure Telemetry
    try {
      const latencyMs = Date.now() - genStartTime;
      const { recordGenerationTelemetry } = await import("../admin/qaTelemetryService");
      let errorCat: any = "provider_error";
      let genStatus: any = "failed";

      if (err instanceof QAInvalidAIOutputError) {
        errorCat = "invalid_schema";
        genStatus = "invalid_output";
      } else if (err.message?.includes("quota") || err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
        errorCat = "rate_limit";
        genStatus = "rate_limited";
      } else if (err.message?.includes("timeout")) {
        errorCat = "timeout";
        genStatus = "timeout";
      } else if (err.message?.includes("missing")) {
        errorCat = "missing_context";
      }

      await recordGenerationTelemetry({
        workspaceId: workspace?.id || null,
        applicationId,
        userId: authenticatedUserId,
        feature: forceRegenerate ? "regenerate" : "prepare",
        status: genStatus,
        errorCategory: errorCat,
        errorMessage: err.message,
        latencyMs,
        modelName: "gemini-3.8-flash",
        platform: "web",
      });
    } catch (telemetryErr) {
      console.warn("[QA Engine] Failure telemetry warning:", telemetryErr);
    }

    // Transition workspace to 'failed' state so user can retry cleanly
    await supabase
      .from("application_qa_workspaces")
      .update({
        status: "failed",
        stale_reason: err.message || "AI generation failed. Please try again.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", workspace.id);

    if (err instanceof QAAuthorizationError || err instanceof QANotFoundError || err instanceof QAGenerationInProgressError || err instanceof QAInvalidAIOutputError) {
      throw err;
    }

    throw new QAGenerationFailedError(err.message || "Failed to generate interview questions");
  }
}
