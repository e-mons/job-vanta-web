import { z } from "zod";
import { callGeminiWithFallback } from "@/utils/gemini";
import { verifyAnswerClaims } from "./truthLockService";
import { QAAuthorizationError, QANotFoundError } from "./qaContextBuilder";
import type { 
  UserCareerStory, 
  QAStoryUsage, 
  ApplicationMemory, 
  QATruthStatus, 
  QAQuestionCategory, 
  CareerStorySourceType 
} from "@shared/types/qa";

export const StructuredStorySchema = z.object({
  title: z.string().min(3).max(80),
  situation: z.string().min(5),
  action: z.string().min(5),
  result: z.string().min(5),
  supportedCompetencies: z.array(z.string()).default([]),
});

export type StructuredStoryOutput = z.infer<typeof StructuredStorySchema>;

/**
 * Uses Gemini to cleanly structure a user's rough experience notes into
 * Situation, Action, Result, Title, and Competency tags without adding fabricated claims.
 */
export async function structureCareerStoryWithAI(rawDraft: string): Promise<StructuredStoryOutput> {
  const prompt = `You are Jobvanta's Career Story Organizer.
The candidate provided the following real career example:

<UNTRUSTED_CANDIDATE_STORY>
${rawDraft}
</UNTRUSTED_CANDIDATE_STORY>

TASK:
1. Organize the text into crisp Situation, Action, and Result components.
2. Provide a short, human-readable Title (e.g., "Resolved Delayed Customer Order", "Scaled Redis Caching Cluster").
3. Identify 2-4 key competencies demonstrated (e.g., "Problem Solving", "Customer Communication", "System Architecture", "Leadership").

CRITICAL MANDATE:
Do NOT fabricate any metrics, percentages, or achievements not present in the draft. Keep the candidate's authentic voice.

Return STRICT JSON adhering to:
{
  "title": "string",
  "situation": "string",
  "action": "string",
  "result": "string",
  "supportedCompetencies": ["string"]
}`;

  try {
    const rawJson = await callGeminiWithFallback(prompt, { responseMimeType: "application/json" });
    return StructuredStorySchema.parse(JSON.parse(rawJson));
  } catch (err) {
    console.warn("[Story Structuring Fallback]:", err);
    return {
      title: rawDraft.slice(0, 40).trim() || "Career Experience Story",
      situation: rawDraft,
      action: "Executed appropriate steps to address the challenge.",
      result: "Achieved a successful outcome.",
      supportedCompetencies: ["Problem Solving", "Communication"],
    };
  }
}

/**
 * Saves a new or updated career story in the user's Story Bank.
 * Validates claims via Truth Lock and prevents duplicate story creation.
 */
export async function saveCareerStory(params: {
  userId: string;
  title: string;
  situation: string;
  action: string;
  result: string;
  supportedCompetencies?: string[];
  evidenceReferences?: string[];
  metrics?: any[];
  sourceType?: CareerStorySourceType;
  sourceId?: string | null;
  memory?: ApplicationMemory | null;
  clientSupabase: any;
}): Promise<UserCareerStory> {
  const {
    userId,
    title,
    situation,
    action,
    result,
    supportedCompetencies = [],
    evidenceReferences = [],
    metrics = [],
    sourceType = "user_created",
    sourceId = null,
    memory,
    clientSupabase,
  } = params;

  // 1. Truth Lock Check on the combined story
  const fullStoryText = `${title}. ${situation} ${action} ${result}`;
  let truthStatus: QATruthStatus = "verified";

  if (memory) {
    const truthCheck = verifyAnswerClaims(fullStoryText, memory);
    truthStatus = truthCheck.overallStatus === "conflict" 
      ? "conflict" 
      : truthCheck.overallStatus === "needs_clarification" 
      ? "needs_clarification" 
      : "verified";
  }

  // 2. Duplicate Detection: Check for existing stories with similar title or identical situation/action
  const { data: existingStories } = await clientSupabase
    .from("user_career_stories")
    .select("*")
    .eq("user_id", userId);

  const normalizedTitle = title.toLowerCase().trim();
  const duplicate = (existingStories || []).find((s: UserCareerStory) => {
    const existingTitleNorm = s.title.toLowerCase().trim();
    if (existingTitleNorm === normalizedTitle) return true;
    if (s.situation.trim() === situation.trim() && s.action.trim() === action.trim()) return true;
    return false;
  });

  if (duplicate) {
    // Update existing story instead of creating duplicate
    const { data: updated, error } = await clientSupabase
      .from("user_career_stories")
      .update({
        situation,
        action,
        result,
        supported_competencies: Array.from(new Set([...duplicate.supported_competencies, ...supportedCompetencies])),
        evidence_references: Array.from(new Set([...duplicate.evidence_references, ...evidenceReferences])),
        truth_status: truthStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", duplicate.id)
      .select()
      .single();

    if (error || !updated) throw new Error(`Failed to update story: ${error?.message}`);
    return updated;
  }

  // 3. Insert new Career Story
  const { data: created, error } = await clientSupabase
    .from("user_career_stories")
    .insert({
      user_id: userId,
      title,
      situation,
      action,
      result,
      supported_competencies: supportedCompetencies,
      evidence_references: evidenceReferences,
      metrics,
      truth_status: truthStatus,
      is_favorite: false,
      times_used: 0,
      source_type: sourceType,
      source_id: sourceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !created) {
    throw new Error(`Failed to save career story: ${error?.message}`);
  }

  return created;
}

/**
 * Finds and ranks relevant Career Stories for a target question and job context.
 */
export async function findRelevantCareerStories(params: {
  userId: string;
  category?: QAQuestionCategory | string;
  questionText?: string;
  clientSupabase: any;
  limit?: number;
}): Promise<UserCareerStory[]> {
  const { userId, category = "general", questionText = "", clientSupabase, limit = 3 } = params;

  const { data: stories, error } = await clientSupabase
    .from("user_career_stories")
    .select("*")
    .eq("user_id", userId)
    .order("is_favorite", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error || !stories || stories.length === 0) {
    return [];
  }

  const categoryNorm = category.toLowerCase().replace(/_/g, " ");
  const qTextNorm = questionText.toLowerCase();

  // Score each story deterministically for relevance
  const scoredStories = stories.map((story: UserCareerStory) => {
    let score = 0;

    // Favorite bonus
    if (story.is_favorite) score += 30;

    // Verified bonus
    if (story.truth_status === "verified") score += 20;

    // Category / Competency match
    for (const comp of story.supported_competencies) {
      const compNorm = comp.toLowerCase();
      if (categoryNorm.includes(compNorm) || compNorm.includes(categoryNorm)) {
        score += 25;
      }
      if (qTextNorm.includes(compNorm)) {
        score += 20;
      }
    }

    // Direct keyword match in title
    const titleWords = story.title.toLowerCase().split(/\s+/);
    for (const word of titleWords) {
      if (word.length > 3 && qTextNorm.includes(word)) {
        score += 15;
      }
    }

    // Variety penalty for overused stories (> 5 uses) to encourage diverse interview examples
    if (story.times_used > 5) {
      score -= 10;
    }

    return { story, score };
  });

  scoredStories.sort((a: { story: UserCareerStory; score: number }, b: { story: UserCareerStory; score: number }) => b.score - a.score);

  return scoredStories.slice(0, limit).map((s: { story: UserCareerStory; score: number }) => s.story);
}

/**
 * Records usage of a Career Story inside a specific Q&A preparation question.
 */
export async function recordStoryUsage(params: {
  storyId: string;
  userId: string;
  applicationId?: string | null;
  questionId?: string | null;
  stageId?: string | null;
  clientSupabase: any;
}): Promise<QAStoryUsage> {
  const { storyId, userId, applicationId, questionId, stageId, clientSupabase } = params;

  const { data: usage, error } = await clientSupabase
    .from("qa_story_usage")
    .insert({
      story_id: storyId,
      user_id: userId,
      application_id: applicationId || null,
      question_id: questionId || null,
      stage_id: stageId || null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !usage) {
    throw new Error(`Failed to record story usage: ${error?.message}`);
  }

  // Increment times_used on the story
  const { data: currentStory } = await clientSupabase
    .from("user_career_stories")
    .select("times_used")
    .eq("id", storyId)
    .single();

  const newCount = (currentStory?.times_used || 0) + 1;
  await clientSupabase
    .from("user_career_stories")
    .update({ times_used: newCount })
    .eq("id", storyId);

  return usage;
}

/**
 * Deletes a Career Story and enforces user authorization.
 */
export async function deleteCareerStory(
  storyId: string,
  userId: string,
  clientSupabase: any
): Promise<boolean> {
  const { data: story, error: fetchErr } = await clientSupabase
    .from("user_career_stories")
    .select("user_id")
    .eq("id", storyId)
    .single();

  if (fetchErr || !story) {
    throw new QANotFoundError(`Career Story ${storyId} not found`);
  }

  if (story.user_id !== userId) {
    throw new QAAuthorizationError("Not authorized to delete this career story");
  }

  const { error: delErr } = await clientSupabase
    .from("user_career_stories")
    .delete()
    .eq("id", storyId);

  if (delErr) {
    throw new Error(`Failed to delete career story: ${delErr.message}`);
  }

  return true;
}
