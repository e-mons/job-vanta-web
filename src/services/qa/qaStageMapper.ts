import type { QAStageType } from "@shared/types/qa";

export interface StageMetadata {
  stageType: QAStageType;
  stageOrder: number;
  title: string;
  recommendedQuestionCount: { min: number; max: number };
  focusAreas: string[];
  description: string;
}

export const STAGE_DEFINITIONS: Record<QAStageType, StageMetadata> = {
  application: {
    stageType: "application",
    stageOrder: 1,
    title: "Application Review & Resume Validation",
    recommendedQuestionCount: { min: 8, max: 12 },
    focusAreas: ["Resume bullet points", "Foundational motivation", "Role-fit statements", "Logistics & availability"],
    description: "Initial application stage validating resume claims, basic qualifications, and career background.",
  },
  recruiter_screening: {
    stageType: "recruiter_screening",
    stageOrder: 2,
    title: "Recruiter & HR Screening",
    recommendedQuestionCount: { min: 6, max: 10 },
    focusAreas: ["Career trajectory summary", "Salary expectations", "Notice period", "Communication clarity", "Culture fit"],
    description: "High-level recruiter screening verifying compensation expectations, timeline, and professional presence.",
  },
  phone_screen: {
    stageType: "phone_screen",
    stageOrder: 3,
    title: "Phone Screen with Team",
    recommendedQuestionCount: { min: 8, max: 12 },
    focusAreas: ["Problem-solving examples", "Domain competence", "Collaboration style", "Why this company"],
    description: "First substantive interview round with team members or initial hiring manager touchpoint.",
  },
  technical_interview: {
    stageType: "technical_interview",
    stageOrder: 4,
    title: "Technical & Role Competency",
    recommendedQuestionCount: { min: 10, max: 16 },
    focusAreas: ["Tools & technical architecture", "Methodology & execution", "System troubleshooting", "Edge cases & trade-offs"],
    description: "Deep-dive assessment of practical skills, tooling mastery, and domain-specific problem resolution.",
  },
  hiring_manager: {
    stageType: "hiring_manager",
    stageOrder: 5,
    title: "Hiring Manager & Leadership Round",
    recommendedQuestionCount: { min: 10, max: 14 },
    focusAreas: ["Ownership & decision-making", "Conflict resolution", "Cross-functional impact", "Past project outcomes"],
    description: "Leadership interview evaluating real business outcomes, team dynamics, and long-term potential.",
  },
  final_interview: {
    stageType: "final_interview",
    stageOrder: 6,
    title: "Final Round & Executive Panel",
    recommendedQuestionCount: { min: 8, max: 14 },
    focusAreas: ["Strategic vision", "Company mission alignment", "Executive presence", "Overcoming hard objections"],
    description: "Final panel or executive conversation evaluating strategic fit and institutional values.",
  },
  offer_discussion: {
    stageType: "offer_discussion",
    stageOrder: 7,
    title: "Offer & Compensation Discussion",
    recommendedQuestionCount: { min: 4, max: 8 },
    focusAreas: ["Compensation negotiation", "Start date logistics", "Benefits & equity", "Decision factors"],
    description: "Final stage focused on negotiating terms, confirming start dates, and closing the offer.",
  },
  general: {
    stageType: "general",
    stageOrder: 1,
    title: "Comprehensive Interview Preparation",
    recommendedQuestionCount: { min: 10, max: 16 },
    focusAreas: ["Behavioral stories", "Technical skills", "Situational problem-solving", "Motivation"],
    description: "All-round interview preparation covering all key interview competencies.",
  },
};

/**
 * Maps raw application status strings from JobVanta application tracking
 * to canonical QAStageType.
 */
export function mapApplicationStatusToStageType(applicationStatus: string | null | undefined): QAStageType {
  if (!applicationStatus) return "application";

  const normalized = applicationStatus.toLowerCase().trim().replace(/[-\s]+/g, "_");

  // Application / Draft
  if (["draft", "preparing", "applied", "submitted", "awaiting_response", "pending"].includes(normalized)) {
    return "application";
  }

  // Recruiter Screening
  if (["screening", "recruiter_call", "hr_screening", "recruiter_interview", "recruiter", "hr_call"].includes(normalized)) {
    return "recruiter_screening";
  }

  // Phone Screen
  if (["phone_screen", "phone_interview", "initial_screen", "first_round"].includes(normalized)) {
    return "phone_screen";
  }

  // Technical / Practical
  if (["technical", "technical_interview", "coding", "system_design", "live_coding", "take_home", "skills_assessment", "tech_screen"].includes(normalized)) {
    return "technical_interview";
  }

  // Hiring Manager
  if (["hiring_manager", "manager_round", "team_interview", "manager_call", "round_2", "second_round"].includes(normalized)) {
    return "hiring_manager";
  }

  // Final Round
  if (["final", "final_round", "final_interview", "panel", "executive", "onsite", "third_round", "round_3", "fourth_round"].includes(normalized)) {
    return "final_interview";
  }

  // Offer
  if (["offer", "offer_received", "negotiation", "compensation", "offer_discussion", "offer_stage"].includes(normalized)) {
    return "offer_discussion";
  }

  // Completed / Terminated
  if (["hired", "accepted", "rejected", "withdrawn", "archived", "closed"].includes(normalized)) {
    return "general";
  }

  return "general";
}

/**
 * Returns whether an application is in an active hiring process.
 */
export function isApplicationActive(applicationStatus: string | null | undefined): boolean {
  if (!applicationStatus) return true;
  const normalized = applicationStatus.toLowerCase().trim();
  return !["rejected", "withdrawn", "archived", "closed"].includes(normalized);
}
