import { z } from "zod";

/**
 * Zod schema for individual question generation output from Gemini.
 */
export const QAQuestionOutputSchema = z.object({
  questionText: z.string().min(5, "Question text must be at least 5 characters"),
  category: z.preprocess((val) => {
    if (!val || typeof val !== "string") return "general";
    const n = val.toLowerCase().trim();
    if (n.includes("behavior")) return "behavioral";
    if (n.includes("tech") || n.includes("code") || n.includes("competenc")) return "technical";
    if (n.includes("situation")) return "situational";
    if (n.includes("resume") || n.includes("dive") || n.includes("background")) return "resume_deep_dive";
    if (n.includes("culture") || n.includes("fit") || n.includes("value")) return "culture_fit";
    if (n.includes("curve") || n.includes("puzzle")) return "curveball";
    if (n.includes("comp") || n.includes("salary") || n.includes("money")) return "compensation";
    return "general";
  }, z.enum([
    "behavioral",
    "technical",
    "situational",
    "resume_deep_dive",
    "culture_fit",
    "curveball",
    "compensation",
    "general"
  ])).default("general"),
  priority: z.preprocess((val) => {
    if (!val || typeof val !== "string") return "medium";
    const n = val.toLowerCase().trim();
    if (n.includes("high")) return "high";
    if (n.includes("low")) return "low";
    return "medium";
  }, z.enum(["high", "medium", "low"])).default("medium"),
  riskLevel: z.preprocess((val) => {
    if (!val || typeof val !== "string") return "low";
    const n = val.toLowerCase().trim();
    if (n.includes("high")) return "high";
    if (n.includes("med")) return "medium";
    return "low";
  }, z.enum(["high", "medium", "low"])).default("low"),
  difficulty: z.preprocess((val) => {
    if (!val || typeof val !== "string") return "medium";
    const n = val.toLowerCase().trim();
    if (n.includes("easy")) return "easy";
    if (n.includes("hard")) return "hard";
    return "medium";
  }, z.enum(["easy", "medium", "hard"])).default("medium"),
  whatEmployerMeans: z.string().min(5, "What employer means must be descriptive"),
  relevanceRationale: z.string().optional().default("Directly relevant to role requirements"),
  answerStrategy: z.string().optional().default("Situation, Action, Result"),
  evidenceReferences: z.array(z.string()).default([]),
  answerAnchors: z.array(
    z.object({
      fact: z.string(),
      sourceSection: z.preprocess((val) => {
        if (!val || typeof val !== "string") return "general";
        const n = val.toLowerCase().trim();
        if (n.includes("exp") || n.includes("work") || n.includes("job") || n.includes("career")) return "experience";
        if (n.includes("skill") || n.includes("tech") || n.includes("tool")) return "skills";
        if (n.includes("edu") || n.includes("school") || n.includes("degree") || n.includes("acad")) return "education";
        if (n.includes("proj")) return "projects";
        if (n.includes("cert")) return "certifications";
        return "general";
      }, z.enum([
        "experience",
        "skills",
        "education",
        "projects",
        "certifications",
        "general"
      ])).default("general"),
      confidence: z.preprocess((val) => {
        if (!val || typeof val !== "string") return "medium";
        const n = val.toLowerCase().trim();
        if (n.includes("high")) return "high";
        if (n.includes("low")) return "low";
        return "medium";
      }, z.enum(["high", "medium", "low"])).default("medium")
    })
  ).default([]),
  suggestedQuick: z.string().nullable().optional(),
  suggestedNormal: z.string().nullable().optional(),
  suggestedDetailed: z.string().nullable().optional(),
  truthStatus: z.enum([
    "verified",
    "unverified",
    "needs_clarification",
    "confirmed_by_user",
    "conflict",
    "insufficient_evidence",
    "stale"
  ]).default("verified"),
  clarificationTopic: z.string().nullable().optional(),
  clarificationPrompt: z.string().nullable().optional(),
});

/**
 * Zod schema for full Gemini preparation set response.
 */
export const QAGenerationOutputSchema = z.object({
  readinessScore: z.number().int().min(0).max(100).default(70),
  seniorityLevel: z.enum(["junior", "mid", "senior", "lead", "executive"]).default("mid"),
  roleSummary: z.string().optional().default(""),
  keyFocusAreas: z.array(z.string()).default([]),
  questions: z.array(QAQuestionOutputSchema).min(1, "Must contain at least 1 question"),
});

export type QAQuestionOutput = z.infer<typeof QAQuestionOutputSchema>;
export type QAGenerationOutput = z.infer<typeof QAGenerationOutputSchema>;
