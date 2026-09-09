import { callGeminiWithFallback } from "@/utils/gemini";
import { QAAuthorizationError, QANotFoundError } from "./qaContextBuilder";
import type { 
  QAActualInterviewQuestion, 
  QAInterviewCheckin, 
  RoundLearningSummary, 
  QAQuestion 
} from "@shared/types/qa";

/**
 * Checks whether an actually asked question semantically matches any predicted question in the workspace.
 */
export async function matchActualToPredictedQuestion(
  actualText: string,
  predictedQuestions: QAQuestion[]
): Promise<string | null> {
  if (!predictedQuestions || predictedQuestions.length === 0) return null;

  const actualNorm = actualText.toLowerCase().trim();

  // 1. Direct sub-string match
  for (const pq of predictedQuestions) {
    const pText = (pq.question_text || (pq as any).questionText || "").toLowerCase().trim();
    if (pText === actualNorm || pText.includes(actualNorm) || actualNorm.includes(pText)) {
      return pq.id;
    }
  }

  // 2. Keyword overlap check (> 50% significant word overlap)
  const actualWords = new Set(actualNorm.split(/\s+/).filter((w: string) => w.length > 3));
  for (const pq of predictedQuestions) {
    const pText = (pq.question_text || (pq as any).questionText || "").toLowerCase();
    const pWords = pText.split(/\s+/).filter((w: string) => w.length > 3);
    const commonCount = pWords.filter((w: string) => actualWords.has(w)).length;

    if (actualWords.size > 0 && commonCount / actualWords.size >= 0.5) {
      return pq.id;
    }
  }

  return null;
}

/**
 * Records an actual question asked in a real interview round.
 */
export async function recordActualInterviewQuestion(params: {
  applicationId: string;
  stageId?: string | null;
  userId: string;
  questionText: string;
  difficultyRating?: "handled_well" | "neutral" | "struggled";
  notes?: string | null;
  clientSupabase: any;
}): Promise<QAActualInterviewQuestion> {
  const {
    applicationId,
    stageId,
    userId,
    questionText,
    difficultyRating = "neutral",
    notes = null,
    clientSupabase,
  } = params;

  // Fetch predicted questions in this workspace to find semantic link
  const { data: workspace } = await clientSupabase
    .from("application_qa_workspaces")
    .select("id")
    .eq("application_id", applicationId)
    .single();

  let matchedPredictedId: string | null = null;
  if (workspace) {
    const { data: predicted } = await clientSupabase
      .from("qa_questions")
      .select("id, question_text")
      .eq("workspace_id", workspace.id);

    if (predicted) {
      matchedPredictedId = await matchActualToPredictedQuestion(questionText, predicted as QAQuestion[]);
    }
  }

  const { data: created, error } = await clientSupabase
    .from("qa_actual_interview_questions")
    .insert({
      user_id: userId,
      application_id: applicationId,
      stage_id: stageId || null,
      question_text: questionText.trim(),
      matched_predicted_question_id: matchedPredictedId,
      difficulty_rating: difficultyRating,
      notes: notes?.trim() || null,
      source_type: "actually_asked",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !created) {
    throw new Error(`Failed to record actual interview question: ${error?.message}`);
  }

  return created;
}

/**
 * Records post-interview check-in feeling and notes.
 */
export async function recordInterviewCheckin(params: {
  applicationId: string;
  stageId?: string | null;
  userId: string;
  feeling: "good" | "okay" | "difficult";
  notes?: string | null;
  clientSupabase: any;
}): Promise<QAInterviewCheckin> {
  const { applicationId, stageId, userId, feeling, notes, clientSupabase } = params;

  const { data: checkin, error } = await clientSupabase
    .from("qa_interview_checkins")
    .insert({
      application_id: applicationId,
      stage_id: stageId || null,
      user_id: userId,
      feeling,
      notes: notes?.trim() || null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !checkin) {
    throw new Error(`Failed to record interview checkin: ${error?.message}`);
  }

  return checkin;
}

/**
 * Builds Round Learning Summary from previous round's questions and feedback.
 */
export async function getRoundLearningSummary(
  applicationId: string,
  userId: string,
  clientSupabase: any
): Promise<RoundLearningSummary | null> {
  // Fetch actual questions for this application
  const { data: actualQuestions } = await clientSupabase
    .from("qa_actual_interview_questions")
    .select("*")
    .eq("application_id", applicationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // Fetch most recent checkin
  const { data: checkin } = await clientSupabase
    .from("qa_interview_checkins")
    .select("*")
    .eq("application_id", applicationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!actualQuestions || actualQuestions.length === 0) {
    if (!checkin) return null;
  }

  const struggledTopics = (actualQuestions || [])
    .filter((q: QAActualInterviewQuestion) => q.difficulty_rating === "struggled")
    .map((q: QAActualInterviewQuestion) => q.question_text);

  const wellHandledTopics = (actualQuestions || [])
    .filter((q: QAActualInterviewQuestion) => q.difficulty_rating === "handled_well")
    .map((q: QAActualInterviewQuestion) => q.question_text);

  const nextRoundPriorities: string[] = [];
  if (struggledTopics.length > 0) {
    nextRoundPriorities.push(`Deepen prepared examples for: ${struggledTopics.slice(0, 2).join("; ")}`);
  }
  if (actualQuestions && actualQuestions.length > 0) {
    nextRoundPriorities.push("Focus on next-level strategic and leadership questions rather than repeating screening basics.");
  }

  return {
    previousRoundTitle: "Previous Interview Round",
    feeling: checkin?.feeling || null,
    actualQuestions: actualQuestions || [],
    struggledTopics,
    wellHandledTopics,
    nextRoundPriorities,
  };
}
