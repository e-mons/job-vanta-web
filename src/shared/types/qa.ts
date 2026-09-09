/**
 * JobVanta - Job-Specific AI Questions & Answers Domain Types
 * Shared across Web & Mobile clients and Backend services.
 */

export type QAWorkspaceStatus = 
  | 'not_prepared' 
  | 'preparing' 
  | 'ready' 
  | 'failed' 
  | 'stale' 
  | 'regenerating';

export type QAStageType = 
  | 'application' 
  | 'recruiter_screening' 
  | 'phone_screen' 
  | 'technical_interview' 
  | 'hiring_manager' 
  | 'final_interview' 
  | 'offer_discussion' 
  | 'general';

export type QAStageStatus = 'not_started' | 'in_progress' | 'completed';

export type QAQuestionCategory = 
  | 'behavioral' 
  | 'technical' 
  | 'situational' 
  | 'resume_deep_dive' 
  | 'culture_fit' 
  | 'curveball' 
  | 'compensation' 
  | 'user_reported' 
  | 'general';

export type QAPriority = 'high' | 'medium' | 'low';
export type QARiskLevel = 'high' | 'medium' | 'low';

export type QAAnswerActiveVersion = 'quick' | 'normal' | 'detailed' | 'custom';
export type QATruthStatus = 
  | 'verified' 
  | 'unverified' 
  | 'needs_clarification' 
  | 'confirmed_by_user' 
  | 'conflict' 
  | 'insufficient_evidence' 
  | 'stale';

export type QAPracticeMode = 'text' | 'voice' | 'flashcard' | 'quick_refresh';
export type QAClarificationStatus = 'pending' | 'resolved' | 'dismissed';
export type QAClarificationType = 'yes_no_little' | 'number' | 'text' | 'choice' | 'conflict_resolution';
export type QAClarificationScope = 'application' | 'global';

export type EvidenceStrength = 'strong' | 'moderate' | 'limited' | 'missing' | 'conflicting';
export type QuestionLikelihood = 'very_likely' | 'likely' | 'possible' | 'less_likely';
export type PreparationPriority = 'prepare_first' | 'prepare_next' | 'ready' | 'optional';
export type RiskGroupType = 'strong' | 'prepare' | 'important';

export type ClaimType = 
  | 'years_of_experience'
  | 'employment'
  | 'job_title'
  | 'employer'
  | 'responsibility'
  | 'skill'
  | 'tool'
  | 'achievement'
  | 'metric'
  | 'project'
  | 'certification'
  | 'education'
  | 'leadership'
  | 'team_size'
  | 'salary_expectation'
  | 'notice_period'
  | 'availability'
  | 'location'
  | 'relocation';

export interface AnswerAnchor {
  fact: string;
  sourceSection?: 'experience' | 'skills' | 'education' | 'projects' | 'certifications' | 'general';
  confidence?: 'high' | 'medium' | 'low';
}

export interface QASourceProvenance {
  model?: string;
  generatedAt?: string;
  promptVersion?: string;
  sourceHash?: string;
  regenerationReason?: string;
}

export interface FactualClaim {
  id?: string;
  claimType: ClaimType;
  rawStatement: string;
  claimedValue: string | number;
  extractedMetric?: number | null;
  provenanceRef?: string | null;
  status: QATruthStatus;
  evidenceSource?: string | null;
  conflictReason?: string | null;
}

export interface TruthVerificationDetails {
  verifiedClaimsCount: number;
  unverifiedClaimsCount: number;
  needsClarificationCount: number;
  conflictCount: number;
  claims: FactualClaim[];
  verificationTimestamp: string;
  overallStatus: QATruthStatus;
}

export interface QAWorkspace {
  id: string;
  application_id: string;
  user_id: string;
  status: QAWorkspaceStatus;
  readiness_score: number | null;
  is_stale: boolean;
  stale_reason: string | null;
  source_hash: string | null;
  last_prepared_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QAStage {
  id: string;
  workspace_id: string;
  user_id: string;
  stage_type: QAStageType;
  stage_order: number;
  title: string;
  status: QAStageStatus;
  readiness_score: number | null;
  notes: string | null;
  round_number?: number;
  is_active?: boolean;
  summary_metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface QAQuestion {
  id: string;
  stage_id: string;
  workspace_id: string;
  user_id: string;
  question_text: string;
  category: QAQuestionCategory;
  priority: QAPriority;
  risk_level: QARiskLevel;
  what_employer_means: string | null;
  order_index: number;
  is_user_reported: boolean;
  risk_reason?: string | null;
  evidence_strength?: EvidenceStrength;
  question_likelihood?: QuestionLikelihood;
  preparation_priority?: PreparationPriority;
  is_reviewed?: boolean;
  reviewed_at?: string | null;
  source_provenance: QASourceProvenance | null;
  created_at: string;
  updated_at: string;
}

export interface QAAnswer {
  id: string;
  question_id: string;
  user_id: string;
  suggested_quick: string | null;
  suggested_normal: string | null;
  suggested_detailed: string | null;
  user_edited_answer: string | null;
  active_version: QAAnswerActiveVersion;
  answer_anchors: AnswerAnchor[] | null;
  truth_status: QATruthStatus;
  verification_details: TruthVerificationDetails | null;
  claims_payload: FactualClaim[] | null;
  provenance: QASourceProvenance | null;
  created_at: string;
  updated_at: string;
}

export interface QAClarification {
  id: string;
  workspace_id: string;
  question_id: string | null;
  user_id: string;
  topic: string;
  question_prompt: string;
  clarification_type: QAClarificationType;
  allowed_options: string[] | null;
  scope: QAClarificationScope;
  response_value: string | null;
  user_clarification: string | null;
  status: QAClarificationStatus;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCareerConfirmation {
  id: string;
  user_id: string;
  topic: string;
  claim_type: string;
  confirmation_value: string;
  source_clarification_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface QAPracticeFeedback {
  strengths: string[];
  improvements: string[];
  anchorCoverage: {
    coveredAnchors: string[];
    missedAnchors: string[];
  };
  structureFeedback: string;
  durationFeedback: string;
  truthCheck: {
    status: QATruthStatus;
    warning?: string;
  };
  overallVerdict: 'ready' | 'nearly_ready' | 'needs_another_try';
  comparisonWithPreviousAttempt?: string | null;
}

export interface QAPracticeAttempt {
  id: string;
  question_id: string;
  user_id: string;
  stage_id?: string | null;
  attempt_number?: number;
  mode: QAPracticeMode;
  user_response: string | null;
  transcript?: string | null;
  audio_storage_path: string | null;
  score: number | null;
  feedback: QAPracticeFeedback | null;
  truth_status?: QATruthStatus;
  is_best_attempt?: boolean;
  duration_seconds: number | null;
  created_at: string;
}

export interface FiveMinuteRefreshPayload {
  applicationId: string;
  companyName: string;
  jobTitle: string;
  activeStageTitle: string;
  topSellingPoints: string[];
  topThreeQuestions: RiskRadarItem[];
  bestCareerExample: {
    role: string;
    company: string;
    story: string;
    impact: string;
  };
  criticalRisks: string[];
  whatYouSentSummary: {
    resumeTitle: string;
    experienceYears: number;
    salaryExpectation: string | null;
    noticePeriod: string | null;
  };
  questionsToAskEmployer: string[];
}

export interface NervousModePayload {
  applicationId: string;
  companyName: string;
  jobTitle: string;
  threeThingsToRemember: string[];
  strongestExample: {
    role: string;
    story: string;
  };
  employerTopNeed: string;
  firstQuestion: QAQuestion;
}

/**
 * Phase 4 Risk Radar & Readiness Types
 */
export interface RiskRadarItem {
  questionId: string;
  questionText: string;
  category: QAQuestionCategory;
  priority: QAPriority;
  riskLevel: QARiskLevel;
  riskGroup: RiskGroupType;
  riskReason: string;
  evidenceStrength: EvidenceStrength;
  questionLikelihood: QuestionLikelihood;
  preparationPriority: PreparationPriority;
  isReviewed: boolean;
  truthStatus: QATruthStatus;
  whatEmployerMeans: string | null;
  answer: QAAnswer | null;
}

export interface FiveMinuteRefreshData {
  topThreeQuestions: RiskRadarItem[];
  topStrengths: string[];
  criticalRisks: string[];
  quickReminder: string;
}

export interface RiskRadarSummary {
  workspaceId: string;
  stageType: QAStageType;
  strongCount: number;
  prepareCount: number;
  importantCount: number;
  strongItems: RiskRadarItem[];
  prepareItems: RiskRadarItem[];
  importantItems: RiskRadarItem[];
  topThreeQuestions: RiskRadarItem[];
  fiveMinuteRefresh: FiveMinuteRefreshData;
}

export interface ReadinessBreakdown {
  readinessScore: number;
  readinessLevel: 'Getting Started' | 'Making Progress' | 'Nearly Ready' | 'Ready';
  totalQuestions: number;
  reviewedCount: number;
  strongCount: number;
  prepareCount: number;
  importantCount: number;
  unresolvedTruthCount: number;
  activeStageType: QAStageType;
  activeStageTitle: string;
}

export interface StageTransitionDiff {
  fromStage: QAStageType;
  toStage: QAStageType;
  retainedQuestionsCount: number;
  newQuestionsCount: number;
  upgradedPrioritiesCount: number;
  message: string;
}

export interface StageJourneySummary {
  workspaceId: string;
  activeStage: QAStage;
  allStages: QAStage[];
  readiness: ReadinessBreakdown;
  recentDiff: StageTransitionDiff | null;
}

/**
 * Server-Side Context Builder Data Structures
 */
export interface ApplicationQAContext {
  applicationId: string;
  userId: string;
  status: string;
  appliedAt: string;
  job: {
    title: string;
    company: string;
    location: string | null;
    type: string | null;
    salary: string | null;
    description?: string | null;
    requirements?: string[];
    responsibilities?: string[];
    skills?: string[];
    applyLink?: string | null;
  };
  resume: {
    id?: string | null;
    title?: string | null;
    isSnapshot: boolean;
    personalInfo: {
      fullName?: string;
      email?: string;
      phone?: string;
      location?: string;
      summary?: string;
      website?: string;
    };
    skills: string[];
    experience: {
      company: string;
      role: string;
      dates: string;
      bullets: string[];
    }[];
    education: {
      school: string;
      degree: string;
      year: string;
    }[];
    projects?: {
      name: string;
      description: string;
      technologies: string[];
    }[];
    certifications?: {
      name: string;
      issuer: string;
      date: string;
    }[];
  } | null;
  coverLetter?: {
    title: string;
    content: Record<string, any> | string;
  } | null;
  sourceHash: string;
}

export interface ApplicationMemory {
  applicationId: string;
  userId: string;
  companyName: string;
  jobTitle: string;
  appliedAt: string;
  applicationTruth: {
    hasSubmittedSnapshot: boolean;
    submittedResumeTitle: string | null;
    statedSalaryExpectation: string | null;
    statedAvailability: string | null;
    statedNoticePeriod: string | null;
    statedRelocation: string | null;
    statedWorkAuthorization: string | null;
    submittedSkills: string[];
    submittedExperienceYears: number;
    submittedExperienceRoles: { company: string; role: string; dates: string }[];
    submittedApplicationAnswers: Record<string, string>;
  };
  careerTruth: {
    currentResumeTitle: string | null;
    currentSkills: string[];
    currentExperienceYears: number;
    currentExperienceRoles: { company: string; role: string; dates: string }[];
    activeConfirmations: UserCareerConfirmation[];
  };
  divergences: {
    experienceYearsDiff: number;
    newSkillsAddedSinceSubmission: string[];
    rolesModifiedSinceSubmission: string[];
    salaryRangeChanged: boolean;
  };
  provenance: {
    sourceSnapshotId: string | null;
    isHistoricalImmutable: boolean;
    reconstructedAt: string;
  };
}

/**
 * Phase 7: Career Story Bank & Interview Learning Types
 */
export type CareerStorySourceType = 
  | 'user_created' 
  | 'qa_answer' 
  | 'practice_attempt' 
  | 'resume_evidence' 
  | 'clarification';

export interface UserCareerStory {
  id: string;
  user_id: string;
  title: string;
  situation: string;
  action: string;
  result: string;
  supported_competencies: string[];
  evidence_references: string[];
  metrics: any[];
  truth_status: QATruthStatus;
  is_favorite: boolean;
  times_used: number;
  source_type: CareerStorySourceType;
  source_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface QAStoryUsage {
  id: string;
  story_id: string;
  user_id: string;
  application_id?: string | null;
  question_id?: string | null;
  stage_id?: string | null;
  created_at: string;
}

export interface QAActualInterviewQuestion {
  id: string;
  user_id: string;
  application_id: string;
  stage_id?: string | null;
  question_text: string;
  matched_predicted_question_id?: string | null;
  difficulty_rating: 'handled_well' | 'neutral' | 'struggled';
  notes?: string | null;
  source_type: string;
  created_at: string;
  updated_at: string;
}

export interface QAInterviewCheckin {
  id: string;
  user_id: string;
  application_id: string;
  stage_id?: string | null;
  feeling: 'good' | 'okay' | 'difficult';
  notes?: string | null;
  created_at: string;
}

export interface RoundLearningSummary {
  previousRoundTitle: string;
  feeling: 'good' | 'okay' | 'difficult' | null;
  actualQuestions: QAActualInterviewQuestion[];
  struggledTopics: string[];
  wellHandledTopics: string[];
  nextRoundPriorities: string[];
}
