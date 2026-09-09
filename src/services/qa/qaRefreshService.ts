import { createClient } from "@/utils/supabase/server";
import { buildApplicationQAContext, QANotFoundError } from "./qaContextBuilder";
import { buildApplicationMemory } from "./applicationMemoryService";
import { summarizeRiskRadar } from "./questionRiskRadarService";
import { STAGE_DEFINITIONS, mapApplicationStatusToStageType } from "./qaStageMapper";
import type { 
  FiveMinuteRefreshPayload, 
  NervousModePayload, 
  QAQuestion, 
  QAAnswer,
  QAStageType
} from "@shared/types/qa";

/**
 * Builds high-yield Questions for the Candidate to Ask the Employer,
 * tailored to the company, role, and current interview stage.
 */
export function generateStageEmployerQuestions(
  companyName: string,
  jobTitle: string,
  stageType: QAStageType = "application"
): string[] {
  if (stageType === "recruiter_screening" || stageType === "application") {
    return [
      `What are the most critical milestones for this ${jobTitle} role in the first 90 days?`,
      `How is the team structured, and who would I collaborate with most closely day-to-day?`,
      `What does the remainder of the interview process look like at ${companyName}?`,
    ];
  }

  if (stageType === "technical_interview") {
    return [
      `What are the biggest technical or operational challenges currently facing the engineering team?`,
      `How does ${companyName} balance technical debt with new feature delivery?`,
      `What tooling, architecture, or workflow improvements is the team most excited about this year?`,
    ];
  }

  if (stageType === "hiring_manager") {
    return [
      `How do you measure success and impact for this position over the first six months?`,
      `What qualities separate someone who is good in this role from someone who is truly exceptional?`,
      `How does the team approach decision-making when there are competing technical or product priorities?`,
    ];
  }

  if (stageType === "final_interview") {
    return [
      `What are the company's highest strategic priorities over the next 12 to 18 months?`,
      `How has ${companyName}'s culture evolved as the team has grown?`,
      `What are the biggest opportunities for someone in this role to create long-term company value?`,
    ];
  }

  return [
    `What does success look like in the first six months for this ${jobTitle} position?`,
    `How does the team collaborate cross-functionally across product, design, and engineering?`,
    `What are the most exciting initiatives ${companyName} is working on right now?`,
  ];
}

/**
 * Builds the complete 5-Minute Pre-Interview Refresh Briefing.
 */
export async function buildFiveMinuteRefreshPayload(
  applicationId: string,
  userId: string,
  supabaseClient?: any
): Promise<FiveMinuteRefreshPayload> {
  const supabase = supabaseClient || (await createClient());

  const context = await buildApplicationQAContext(applicationId, userId, supabase);
  const memory = await buildApplicationMemory(applicationId, userId, supabase);

  // Fetch Workspace
  const { data: workspace } = await supabase
    .from("application_qa_workspaces")
    .select("id, status")
    .eq("application_id", applicationId)
    .single();

  if (!workspace) {
    throw new QANotFoundError(`Workspace for application ${applicationId} not found`);
  }

  // Fetch Questions and Answers
  const { data: rawQuestions } = await supabase
    .from("qa_questions")
    .select(`
      *,
      answer:qa_answers(*)
    `)
    .eq("workspace_id", workspace.id)
    .order("order_index", { ascending: true });

  const questionsWithAnswers: (QAQuestion & { answer: QAAnswer | null })[] = (rawQuestions || []).map((q: any) => ({
    ...q,
    answer: Array.isArray(q.answer) ? q.answer[0] || null : q.answer || null,
  }));

  const canonicalStage = mapApplicationStatusToStageType(context.status);
  const stageMeta = STAGE_DEFINITIONS[canonicalStage] || STAGE_DEFINITIONS.general;
  const radarSummary = summarizeRiskRadar(questionsWithAnswers, workspace.id, canonicalStage, memory);

  // 1. Top 3 Selling Points
  const topSellingPoints: string[] = [];
  if (memory.applicationTruth.submittedExperienceYears > 0) {
    topSellingPoints.push(`${memory.applicationTruth.submittedExperienceYears}+ years of verified industry experience in ${memory.jobTitle}.`);
  }
  if (memory.applicationTruth.submittedSkills.length > 0) {
    topSellingPoints.push(`Demonstrated hands-on expertise in ${memory.applicationTruth.submittedSkills.slice(0, 3).join(", ")}.`);
  }
  if (context.resume?.experience && context.resume.experience.length > 0) {
    const topRole = context.resume.experience[0];
    topSellingPoints.push(`Proven track record as ${topRole.role} at ${topRole.company}.`);
  } else {
    topSellingPoints.push("Direct alignment with core role qualifications and strategic goals.");
  }

  // 2. Best Real Career Example (Prefer User's Verified Career Story Bank if available)
  let bestCareerExample = {
    role: context.resume?.experience?.[0]?.role || "Core Role",
    company: context.resume?.experience?.[0]?.company || "Previous Company",
    story: context.resume?.experience?.[0]?.bullets?.[0] || "Led key project initiatives to improve system reliability and delivery speed.",
    impact: "Delivered measurable improvements in team efficiency and project outcomes.",
  };

  const { data: topStory } = await supabase
    .from("user_career_stories")
    .select("*")
    .eq("user_id", userId)
    .eq("truth_status", "verified")
    .order("is_favorite", { ascending: false })
    .order("times_used", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (topStory) {
    bestCareerExample = {
      role: topStory.title,
      company: "Verified Career Experience",
      story: `${topStory.situation} ${topStory.action}`,
      impact: topStory.result,
    };
  }

  // 3. Questions to Ask Them
  const questionsToAskEmployer = generateStageEmployerQuestions(memory.companyName, memory.jobTitle, canonicalStage);

  return {
    applicationId,
    companyName: memory.companyName,
    jobTitle: memory.jobTitle,
    activeStageTitle: stageMeta.title,
    topSellingPoints: topSellingPoints.slice(0, 3),
    topThreeQuestions: radarSummary.topThreeQuestions,
    bestCareerExample,
    criticalRisks: radarSummary.fiveMinuteRefresh.criticalRisks,
    whatYouSentSummary: {
      resumeTitle: memory.applicationTruth.submittedResumeTitle || "Submitted Application Resume",
      experienceYears: memory.applicationTruth.submittedExperienceYears,
      salaryExpectation: memory.applicationTruth.statedSalaryExpectation,
      noticePeriod: memory.applicationTruth.statedNoticePeriod,
    },
    questionsToAskEmployer,
  };
}

/**
 * Builds the minimalist "I'm Nervous — Just Help Me" payload.
 */
export async function buildNervousModePayload(
  applicationId: string,
  userId: string,
  supabaseClient?: any
): Promise<NervousModePayload> {
  const supabase = supabaseClient || (await createClient());

  const context = await buildApplicationQAContext(applicationId, userId, supabase);
  const memory = await buildApplicationMemory(applicationId, userId, supabase);

  // Fetch first or top priority question
  const { data: firstQ } = await supabase
    .from("qa_questions")
    .select("*")
    .eq("user_id", userId)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  const fallbackQuestion: QAQuestion = {
    id: "q-opening",
    stage_id: "stage-1",
    workspace_id: "ws-1",
    user_id: userId,
    question_text: "Tell me about yourself and your background.",
    category: "general",
    priority: "high",
    risk_level: "low",
    what_employer_means: "Give a crisp summary of your career journey, key skills, and why you're interested in this role.",
    order_index: 1,
    is_user_reported: false,
    source_provenance: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const threeThingsToRemember = [
    `You have ${memory.applicationTruth.submittedExperienceYears}+ years of real, verified experience matching this role.`,
    `You know your own projects and achievements best — speak naturally rather than reciting scripts.`,
    `${memory.companyName} wants a problem solver who communicates clearly and stays calm.`,
  ];

  const strongestExample = {
    role: context.resume?.experience?.[0]?.role || "Core Role",
    story: context.resume?.experience?.[0]?.bullets?.[0] || "Successfully led key project deliverables with clear business impact.",
  };

  const employerTopNeed = context.job?.requirements?.[0] || `Strong practical experience in ${memory.jobTitle} execution.`;

  return {
    applicationId,
    companyName: memory.companyName,
    jobTitle: memory.jobTitle,
    threeThingsToRemember,
    strongestExample,
    employerTopNeed,
    firstQuestion: firstQ || fallbackQuestion,
  };
}
