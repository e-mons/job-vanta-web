import type { 
  QAQuestion, 
  QAAnswer, 
  ApplicationMemory, 
  RiskRadarItem, 
  RiskRadarSummary, 
  FiveMinuteRefreshData, 
  QAStageType,
  RiskGroupType,
  EvidenceStrength,
  QuestionLikelihood,
  PreparationPriority
} from "@shared/types/qa";

/**
 * Evaluates individual question preparation risk and groups it into 🟢 Strong, 🟡 Prepare Carefully, or 🔴 Important To Prepare.
 */
export function evaluateQuestionRisk(
  question: QAQuestion,
  answer: QAAnswer | null,
  memory?: ApplicationMemory | null
): RiskRadarItem {
  let riskGroup: RiskGroupType = "prepare";
  let evidenceStrength: EvidenceStrength = "moderate";
  let questionLikelihood: QuestionLikelihood = "likely";
  let preparationPriority: PreparationPriority = "prepare_next";
  let riskReason = question.risk_reason || "";

  const truthStatus = answer?.truth_status || "verified";

  // 1. Critical Conflict from Truth Lock -> Highest Risk (🔴)
  if (truthStatus === "conflict") {
    riskGroup = "important";
    evidenceStrength = "conflicting";
    preparationPriority = "prepare_first";
    questionLikelihood = "very_likely";
    const conflictDetail = answer?.verification_details?.claims.find(c => c.status === "conflict");
    riskReason = conflictDetail?.conflictReason || "Unresolved contradiction between historical application data and current statements.";
  }

  // 2. Missing Evidence / Needs Clarification -> High Risk (🔴)
  else if (truthStatus === "needs_clarification") {
    riskGroup = "important";
    evidenceStrength = "missing";
    preparationPriority = "prepare_first";
    questionLikelihood = "very_likely";
    riskReason = "Crucial job requirement lacks explicit resume evidence; requires simple clarification to establish your talking points.";
  }

  // 3. High Risk / High Priority Role Requirement -> High Risk (🔴)
  else if (question.priority === "high" && question.risk_level === "high") {
    riskGroup = "important";
    evidenceStrength = "limited";
    preparationPriority = "prepare_first";
    questionLikelihood = "very_likely";
    riskReason = riskReason || "Core job responsibility where employer expectations are high and answers will be scrutinized.";
  }

  // 4. Moderate Requirement / Medium Risk -> Prepare Carefully (🟡)
  else if (question.priority === "high" || question.risk_level === "medium" || truthStatus === "unverified") {
    riskGroup = "prepare";
    evidenceStrength = truthStatus === "unverified" ? "limited" : "moderate";
    preparationPriority = "prepare_next";
    questionLikelihood = "likely";
    riskReason = riskReason || "Important interview competency where structured STAR articulation will make a strong impression.";
  }

  // 5. Strong Evidence & Verified Background -> Strong Area (🟢)
  else {
    riskGroup = "strong";
    evidenceStrength = "strong";
    preparationPriority = "ready";
    questionLikelihood = question.priority === "low" ? "possible" : "likely";
    riskReason = riskReason || "Your submitted resume directly supports this competency with verified career achievements.";
  }

  return {
    questionId: question.id,
    questionText: question.question_text || (question as any).questionText || "",
    category: question.category,
    priority: question.priority,
    riskLevel: question.risk_level,
    riskGroup,
    riskReason,
    evidenceStrength,
    questionLikelihood,
    preparationPriority,
    isReviewed: Boolean(question.is_reviewed),
    truthStatus,
    whatEmployerMeans: question.what_employer_means,
    answer,
  };
}

/**
 * Deterministically selects the Top N questions the user should practice first.
 */
export function selectTopQuestionsToPrepare(
  items: RiskRadarItem[],
  limit: number = 3
): RiskRadarItem[] {
  // Sort priority: Important (🔴) first, then unreviewed Prepare (🟡), then Strong (🟢)
  const priorityWeights: Record<RiskGroupType, number> = {
    important: 3,
    prepare: 2,
    strong: 1,
  };

  const sorted = [...items].sort((a, b) => {
    const weightDiff = priorityWeights[b.riskGroup] - priorityWeights[a.riskGroup];
    if (weightDiff !== 0) return weightDiff;

    // Secondary sort: unreviewed before reviewed
    if (a.isReviewed !== b.isReviewed) {
      return a.isReviewed ? 1 : -1;
    }

    return 0;
  });

  return sorted.slice(0, limit);
}

/**
 * Builds the 5-Minute Pre-Interview Refresh summary.
 */
export function buildFiveMinuteRefresh(
  items: RiskRadarItem[],
  memory?: ApplicationMemory | null
): FiveMinuteRefreshData {
  const topThree = selectTopQuestionsToPrepare(items, 3);

  // Extract candidate top strengths
  const strongItems = items.filter(i => i.riskGroup === "strong");
  const topStrengths: string[] = [];

  if (strongItems.length > 0) {
    strongItems.slice(0, 3).forEach(s => {
      topStrengths.push(s.whatEmployerMeans || s.questionText);
    });
  } else if (memory && memory.applicationTruth.submittedSkills.length > 0) {
    topStrengths.push(...memory.applicationTruth.submittedSkills.slice(0, 3).map(s => `Verified expertise in ${s}`));
  } else {
    topStrengths.push("Direct alignment with role requirements", "Strong communication fundamentals", "Clear career trajectory");
  }

  // Extract critical risks
  const importantItems = items.filter(i => i.riskGroup === "important");
  const criticalRisks: string[] = [];

  if (importantItems.length > 0) {
    importantItems.slice(0, 2).forEach(item => {
      criticalRisks.push(`${item.questionText}: ${item.riskReason}`);
    });
  } else {
    criticalRisks.push("Be ready to explain any technical trade-offs honestly without overstating unverified metrics.");
  }

  return {
    topThreeQuestions: topThree,
    topStrengths: topStrengths.slice(0, 3),
    criticalRisks: criticalRisks.slice(0, 2),
    quickReminder: "Take a breath before answering. State the situation briefly, emphasize your specific actions, and share the concrete result.",
  };
}

/**
 * Compiles the complete Question Risk Radar summary for a workspace stage.
 */
export function summarizeRiskRadar(
  questions: (QAQuestion & { answer: QAAnswer | null })[],
  workspaceId: string,
  stageType: QAStageType = "application",
  memory?: ApplicationMemory | null
): RiskRadarSummary {
  const evaluatedItems = questions.map(q => evaluateQuestionRisk(q, q.answer, memory));

  const strongItems = evaluatedItems.filter(i => i.riskGroup === "strong");
  const prepareItems = evaluatedItems.filter(i => i.riskGroup === "prepare");
  const importantItems = evaluatedItems.filter(i => i.riskGroup === "important");

  const topThreeQuestions = selectTopQuestionsToPrepare(evaluatedItems, 3);
  const fiveMinuteRefresh = buildFiveMinuteRefresh(evaluatedItems, memory);

  return {
    workspaceId,
    stageType,
    strongCount: strongItems.length,
    prepareCount: prepareItems.length,
    importantCount: importantItems.length,
    strongItems,
    prepareItems,
    importantItems,
    topThreeQuestions,
    fiveMinuteRefresh,
  };
}
