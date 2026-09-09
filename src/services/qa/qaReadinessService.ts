import type { 
  QAWorkspace, 
  QAStage, 
  QAQuestion, 
  QAAnswer, 
  ReadinessBreakdown, 
  QAStageType 
} from "@shared/types/qa";
import { evaluateQuestionRisk } from "./questionRiskRadarService";
import { STAGE_DEFINITIONS } from "./qaStageMapper";

/**
 * Calculates an explainable, structured Interview Readiness Score (0-100)
 * based on question priority weights, review states, and Truth Lock status.
 */
export function calculateApplicationQAReadiness(
  workspace: QAWorkspace,
  stages: QAStage[],
  questions: (QAQuestion & { answer: QAAnswer | null })[],
  activeStageType: QAStageType = "application"
): ReadinessBreakdown {
  if (!questions || questions.length === 0) {
    const stageMeta = STAGE_DEFINITIONS[activeStageType] || STAGE_DEFINITIONS.general;
    return {
      readinessScore: 0,
      readinessLevel: "Getting Started",
      totalQuestions: 0,
      reviewedCount: 0,
      strongCount: 0,
      prepareCount: 0,
      importantCount: 0,
      unresolvedTruthCount: 0,
      activeStageType,
      activeStageTitle: stageMeta.title,
    };
  }

  const priorityWeights: Record<string, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  let maxWeightedPoints = 0;
  let earnedPoints = 0;

  let reviewedCount = 0;
  let strongCount = 0;
  let prepareCount = 0;
  let importantCount = 0;
  let unresolvedTruthCount = 0;

  for (const q of questions) {
    const weight = priorityWeights[q.priority] || 2;
    maxWeightedPoints += weight;

    const evaluated = evaluateQuestionRisk(q, q.answer);

    if (evaluated.riskGroup === "strong") strongCount++;
    else if (evaluated.riskGroup === "prepare") prepareCount++;
    else if (evaluated.riskGroup === "important") importantCount++;

    if (q.is_reviewed) reviewedCount++;

    const truth = q.answer?.truth_status || "verified";
    let multiplier = 0.8; // Default for generated verified unreviewed question

    if (truth === "conflict") {
      multiplier = 0.0;
      unresolvedTruthCount++;
    } else if (truth === "needs_clarification") {
      multiplier = 0.2;
      unresolvedTruthCount++;
    } else if (truth === "unverified") {
      multiplier = 0.5;
    } else if (truth === "confirmed_by_user") {
      multiplier = q.is_reviewed ? 1.0 : 0.95;
    } else if (truth === "verified") {
      multiplier = q.is_reviewed ? 1.0 : 0.85;
    }

    earnedPoints += weight * multiplier;
  }

  const calculatedScore = maxWeightedPoints > 0 
    ? Math.min(100, Math.max(0, Math.round((earnedPoints / maxWeightedPoints) * 100)))
    : 0;

  let readinessLevel: "Getting Started" | "Making Progress" | "Nearly Ready" | "Ready" = "Getting Started";
  if (calculatedScore >= 90) {
    readinessLevel = "Ready";
  } else if (calculatedScore >= 70) {
    readinessLevel = "Nearly Ready";
  } else if (calculatedScore >= 40) {
    readinessLevel = "Making Progress";
  } else {
    readinessLevel = "Getting Started";
  }

  const stageMeta = STAGE_DEFINITIONS[activeStageType] || STAGE_DEFINITIONS.general;

  return {
    readinessScore: calculatedScore,
    readinessLevel,
    totalQuestions: questions.length,
    reviewedCount,
    strongCount,
    prepareCount,
    importantCount,
    unresolvedTruthCount,
    activeStageType,
    activeStageTitle: stageMeta.title,
  };
}
