import { createClient } from "@/utils/supabase/server";
import { QAAuthorizationError, QANotFoundError } from "./qaContextBuilder";
import { formatTruthfulSkillAnswer } from "./truthLockService";
import type { 
  QAClarification, 
  QAClarificationScope, 
  QAClarificationType,
  QAAnswer 
} from "@shared/types/qa";

export interface SubmitClarificationResult {
  clarification: QAClarification;
  updatedAnswer: QAAnswer | null;
  savedGlobalConfirmation: boolean;
}

/**
 * Validates user response according to clarification type.
 */
export function validateClarificationResponse(
  type: QAClarificationType,
  value: string,
  allowedOptions?: string[] | null
): string {
  if (!value || typeof value !== "string" || !value.trim()) {
    throw new Error("Clarification response cannot be empty");
  }

  const cleaned = value.trim();

  if (type === "yes_no_little") {
    const normalized = cleaned.toLowerCase();
    if (!["yes", "no", "a_little", "a little"].includes(normalized)) {
      throw new Error("Invalid option for Yes/No/A Little clarification. Allowed: 'yes', 'no', 'a_little'");
    }
    return normalized === "a little" ? "a_little" : normalized;
  }

  if (type === "number") {
    const num = Number(cleaned);
    if (isNaN(num) || num < 0 || num > 1000000000) {
      throw new Error("Invalid number provided for numeric clarification");
    }
    return String(num);
  }

  if (type === "choice" && allowedOptions && allowedOptions.length > 0) {
    if (!allowedOptions.includes(cleaned)) {
      throw new Error(`Invalid choice. Allowed: ${allowedOptions.join(", ")}`);
    }
    return cleaned;
  }

  if (type === "text" || type === "conflict_resolution") {
    if (cleaned.length > 1000) {
      throw new Error("Clarification text exceeds maximum length of 1000 characters");
    }
    return cleaned;
  }

  return cleaned;
}

/**
 * Handles user submission of a clarification question.
 * Atomically updates clarification state, updates global confirmations if scoped,
 * and selectively refreshes the dependent suggested answer without full regeneration.
 */
export async function submitClarification(
  clarificationId: string,
  responseValue: string,
  authenticatedUserId: string,
  options: {
    scope?: QAClarificationScope;
    supabaseClient?: any;
  } = {}
): Promise<SubmitClarificationResult> {
  const supabase = options.supabaseClient || (await createClient());

  // 1. Fetch clarification record
  const { data: clarification, error: fetchErr } = await supabase
    .from("qa_clarifications")
    .select("*")
    .eq("id", clarificationId)
    .single();

  if (fetchErr || !clarification) {
    throw new QANotFoundError(`Clarification ${clarificationId} not found`);
  }

  // 2. Ownership verification
  if (clarification.user_id !== authenticatedUserId) {
    throw new QAAuthorizationError("You are not authorized to update this clarification");
  }

  // 3. Validate response
  const targetScope: QAClarificationScope = options.scope || clarification.scope || "application";
  const validValue = validateClarificationResponse(
    clarification.clarification_type || "yes_no_little",
    responseValue,
    clarification.allowed_options
  );

  // 4. Update clarification record
  const { data: updatedClarification, error: updateErr } = await supabase
    .from("qa_clarifications")
    .update({
      response_value: validValue,
      user_clarification: validValue,
      scope: targetScope,
      status: "resolved",
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", clarificationId)
    .select()
    .single();

  if (updateErr || !updatedClarification) {
    throw new Error(`Failed to update clarification: ${updateErr?.message}`);
  }

  // 5. If global scope, upsert into user_career_confirmations
  let savedGlobal = false;
  if (targetScope === "global") {
    const { error: confErr } = await supabase
      .from("user_career_confirmations")
      .upsert({
        user_id: authenticatedUserId,
        topic: clarification.topic,
        claim_type: "skill",
        confirmation_value: validValue,
        source_clarification_id: clarification.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,topic",
      });

    if (!confErr) {
      savedGlobal = true;
    }
  }

  // 6. Selectively refresh dependent answer if linked to a question
  let updatedAnswer: QAAnswer | null = null;
  if (clarification.question_id) {
    const { data: existingAnswer } = await supabase
      .from("qa_answers")
      .select("*")
      .eq("question_id", clarification.question_id)
      .maybeSingle();

    if (existingAnswer) {
      let newQuick = existingAnswer.suggested_quick;
      let newNormal = existingAnswer.suggested_normal;

      if (clarification.clarification_type === "yes_no_little" && ["yes", "no", "a_little"].includes(validValue)) {
        const fallbacks = formatTruthfulSkillAnswer(clarification.topic, validValue as any);
        newQuick = fallbacks.quick;
        newNormal = fallbacks.normal;
      }

      const { data: refreshedAnswer } = await supabase
        .from("qa_answers")
        .update({
          suggested_quick: newQuick,
          suggested_normal: newNormal,
          truth_status: "confirmed_by_user",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAnswer.id)
        .select()
        .single();

      updatedAnswer = refreshedAnswer;
    }
  }

  return {
    clarification: updatedClarification,
    updatedAnswer,
    savedGlobalConfirmation: savedGlobal,
  };
}
