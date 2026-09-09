import { createClient } from "@/utils/supabase/server";
import { buildApplicationQAContext, QAAuthorizationError, QANotFoundError } from "./qaContextBuilder";
import { mapApplicationStatusToStageType, STAGE_DEFINITIONS } from "./qaStageMapper";
import { calculateApplicationQAReadiness } from "./qaReadinessService";
import { prepareApplicationQA } from "./qaEngineService";
import type { 
  StageJourneySummary, 
  StageTransitionDiff, 
  QAStageType, 
  QAStage, 
  QAQuestion, 
  QAAnswer 
} from "@shared/types/qa";

/**
 * Reconstructs the complete Stage Journey Timeline, active stage, and readiness for an application.
 */
export async function getStageJourneySummary(
  applicationId: string,
  authenticatedUserId: string,
  supabaseClient?: any
): Promise<StageJourneySummary> {
  const supabase = supabaseClient || (await createClient());

  // 1. Authoritative ownership & context check
  const context = await buildApplicationQAContext(applicationId, authenticatedUserId, supabase);

  // 2. Fetch Workspace
  const { data: workspace } = await supabase
    .from("application_qa_workspaces")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (!workspace) {
    throw new QANotFoundError(`Q&A Workspace for application ${applicationId} not found`);
  }

  // 3. Fetch all Stages
  const { data: stagesData } = await supabase
    .from("qa_preparation_stages")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("stage_order", { ascending: true });

  const allStages: QAStage[] = stagesData || [];

  // 4. Resolve Active Stage
  const canonicalStageType = mapApplicationStatusToStageType(context.status);
  let activeStage = allStages.find(s => s.is_active) || allStages.find(s => s.stage_type === canonicalStageType) || allStages[0];

  if (!activeStage && allStages.length > 0) {
    activeStage = allStages[0];
  }

  // 5. Fetch questions and answers for active stage
  const { data: rawQuestions } = await supabase
    .from("qa_questions")
    .select(`
      *,
      answer:qa_answers(*)
    `)
    .eq("stage_id", activeStage?.id || "")
    .order("order_index", { ascending: true });

  const questionsWithAnswers: (QAQuestion & { answer: QAAnswer | null })[] = (rawQuestions || []).map((q: any) => ({
    ...q,
    answer: Array.isArray(q.answer) ? q.answer[0] || null : q.answer || null,
  }));

  // 6. Calculate Readiness
  const readiness = calculateApplicationQAReadiness(
    workspace,
    allStages,
    questionsWithAnswers,
    activeStage?.stage_type || canonicalStageType
  );

  return {
    workspaceId: workspace.id,
    activeStage: activeStage || {
      id: "stage-default",
      workspace_id: workspace.id,
      user_id: authenticatedUserId,
      stage_type: canonicalStageType,
      stage_order: 1,
      title: STAGE_DEFINITIONS[canonicalStageType].title,
      status: "not_started",
      readiness_score: 0,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    allStages,
    readiness,
    recentDiff: null,
  };
}

/**
 * Transitions an application workspace to a new interview stage,
 * generates stage-specific preparation, and computes the transition diff.
 */
export async function transitionStage(
  applicationId: string,
  targetStageType: QAStageType,
  authenticatedUserId: string,
  options: {
    supabaseClient?: any;
    forceRegenerate?: boolean;
  } = {}
): Promise<{ summary: StageJourneySummary; diff: StageTransitionDiff }> {
  const supabase = options.supabaseClient || (await createClient());

  // 1. Authoritative context & ownership check
  await buildApplicationQAContext(applicationId, authenticatedUserId, supabase);

  // 2. Fetch Workspace
  const { data: workspace } = await supabase
    .from("application_qa_workspaces")
    .select("*")
    .eq("application_id", applicationId)
    .single();

  if (!workspace) {
    throw new QANotFoundError(`Workspace for application ${applicationId} not found`);
  }

  // 3. Find current active stage to calculate diff
  const { data: previousActiveStage } = await supabase
    .from("qa_preparation_stages")
    .select("stage_type, id")
    .eq("workspace_id", workspace.id)
    .eq("is_active", true)
    .maybeSingle();

  const fromStage: QAStageType = previousActiveStage?.stage_type || "application";

  // 4. Set is_active = false for all stages
  await supabase
    .from("qa_preparation_stages")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("workspace_id", workspace.id);

  // 5. Invoke Q&A Engine for target stage
  const preparedResult = await prepareApplicationQA(applicationId, authenticatedUserId, {
    stageType: targetStageType,
    forceRegenerate: options.forceRegenerate,
    customSupabaseClient: supabase,
  });

  // 6. Set is_active = true on target stage
  await supabase
    .from("qa_preparation_stages")
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq("id", preparedResult.stage.id);

  // 7. Calculate Transition Diff
  const stageMeta = STAGE_DEFINITIONS[targetStageType] || STAGE_DEFINITIONS.general;
  const newQuestionsCount = preparedResult.questions.length;
  const diff: StageTransitionDiff = {
    fromStage,
    toStage: targetStageType,
    retainedQuestionsCount: 0,
    newQuestionsCount,
    upgradedPrioritiesCount: preparedResult.questions.filter(q => q.priority === "high").length,
    message: `Advanced to ${stageMeta.title}. Prepared ${newQuestionsCount} role-specific interview questions.`,
  };

  const summary = await getStageJourneySummary(applicationId, authenticatedUserId, supabase);
  summary.recentDiff = diff;

  return { summary, diff };
}

/**
 * Toggles user review status on a question.
 */
export async function toggleQuestionReview(
  questionId: string,
  isReviewed: boolean,
  authenticatedUserId: string,
  supabaseClient?: any
): Promise<QAQuestion> {
  const supabase = supabaseClient || (await createClient());

  const { data: question, error: fetchErr } = await supabase
    .from("qa_questions")
    .select("*")
    .eq("id", questionId)
    .single();

  if (fetchErr || !question) {
    throw new QANotFoundError(`Question ${questionId} not found`);
  }

  if (question.user_id !== authenticatedUserId) {
    throw new QAAuthorizationError("You are not authorized to update this question");
  }

  const { data: updated, error: updateErr } = await supabase
    .from("qa_questions")
    .update({
      is_reviewed: isReviewed,
      reviewed_at: isReviewed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", questionId)
    .select()
    .single();

  if (updateErr || !updated) {
    throw new Error(`Failed to update question review state: ${updateErr?.message}`);
  }

  return updated;
}
