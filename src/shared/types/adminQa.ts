/**
 * Admin, Safety, Monitoring & Management Types for Job-Specific Q&A (Phase 9)
 * Strict Least-Privilege & Privacy Protection
 */

export type AdminRole = 
  | 'super_admin' 
  | 'platform_admin' 
  | 'support_manager' 
  | 'support_lead'
  | 'support_agent'
  | 'ai_ops' 
  | 'readonly_analyst';

export type AdminPermission = 
  | 'qa.view_health'
  | 'qa.view_usage'
  | 'qa.manage_settings'
  | 'qa.retry_failed_generation'
  | 'qa.view_quality_samples'
  | 'qa.manage_ai_config'
  | 'qa.view_costs'
  | 'qa.manage_incidents'
  | 'qa.export_operational_data'
  | 'qa.exceptional_content_access'
  | 'support.manage_tickets'
  | 'support.manage_staff'
  | 'support.view_analytics';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  created_at: string;
  updated_at: string;
}

export type QAGenerationFeature = 
  | 'prepare' 
  | 'regenerate' 
  | 'clarification' 
  | 'voice_practice' 
  | 'typed_practice' 
  | 'story_draft';

export type QAGenerationStatus = 
  | 'success' 
  | 'failed' 
  | 'timeout' 
  | 'invalid_output' 
  | 'rate_limited';

export type QAErrorCategory = 
  | 'none' 
  | 'provider_error' 
  | 'timeout' 
  | 'rate_limit' 
  | 'invalid_schema' 
  | 'missing_context' 
  | 'truth_lock_conflict' 
  | 'unsupported_format' 
  | 'network_error';

export interface QAGenerationLog {
  id: string;
  workspace_id: string | null;
  application_id: string | null;
  user_id: string | null;
  feature: QAGenerationFeature;
  platform: 'web' | 'mobile';
  model_provider: string;
  model_name: string;
  status: QAGenerationStatus;
  error_category: QAErrorCategory;
  error_message: string | null;
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  estimated_cost_usd: number;
  output_validation_state: 'valid' | 'invalid' | 'repaired';
  retry_count: number;
  created_at: string;
}

export type ApprovedGeminiModel = 
  | 'gemini-3.8-flash'
  | 'gemini-3.7-flash'
  | 'gemini-3.6-flash'
  | 'gemini-2.0-flash' 
  | 'gemini-1.5-flash' 
  | 'gemini-1.5-pro';

export const APPROVED_GEMINI_MODELS: ApprovedGeminiModel[] = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

export interface QASettings {
  id: string;
  is_qa_enabled: boolean;
  is_voice_practice_enabled: boolean;
  is_5min_refresh_enabled: boolean;
  is_story_bank_enabled: boolean;
  is_interview_learning_enabled: boolean;
  active_gemini_model: ApprovedGeminiModel;
  generation_timeout_ms: number;
  max_retries: number;
  audio_retention_hours: number;
  rate_limit_per_hour: number;
  prompt_version: number;
  cost_alert_threshold_daily_usd: number;
  updated_at: string;
  updated_by: string | null;
}

export interface PublicQASettings {
  is_qa_enabled: boolean;
  is_voice_practice_enabled: boolean;
  is_5min_refresh_enabled: boolean;
  is_story_bank_enabled: boolean;
  is_interview_learning_enabled: boolean;
  active_incident_notice: string | null;
}

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';

export interface QAIncident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  impacted_subsystems: string[];
  user_notice: string | null;
  started_at: string;
  resolved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type QualityReportType = 
  | 'incorrect' 
  | 'unnatural' 
  | 'irrelevant' 
  | 'wrong_info' 
  | 'truth_lock_incorrect' 
  | 'too_generic' 
  | 'other';

export type QualityReportStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export interface QAQualityReport {
  id: string;
  user_id: string;
  workspace_id: string | null;
  question_id: string | null;
  answer_id: string | null;
  report_type: QualityReportType;
  safe_notes: string | null;
  platform: 'web' | 'mobile';
  status: QualityReportStatus;
  assigned_to: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface QAAdminAuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
  reason: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface SafeDiagnosticSummary {
  workspaceId: string;
  applicationId: string;
  status: string;
  stageTitle: string;
  platform: 'web' | 'mobile';
  resumeAvailable: boolean;
  experienceRecordsCount: number;
  skillsCount: number;
  jobDescriptionLength: number;
  applicationAnswersCount: number;
  lastErrorCategory: QAErrorCategory | null;
  lastErrorMessage: string | null;
  retryEligible: boolean;
  attemptsCount: number;
}

export interface QASystemHealthOverview {
  systemStatus: 'healthy' | 'degraded' | 'incident';
  preparationsToday: number;
  successfulGenerationsToday: number;
  failedGenerationsToday: number;
  averageLatencyMs: number;
  voicePracticeSuccessful: number;
  voicePracticeFailed: number;
  unsupportedClaimsBlocked: number;
  clarificationsRequested: number;
  unresolvedConflicts: number;
  temporaryAudioCleanupStatus: 'healthy' | 'backlog_detected';
  orphanedAudioCount: number;
  providerStatus: 'healthy' | 'degraded' | 'major_failure';
  activeIncident: QAIncident | null;
  estimatedDailyCostUsd: number;
}

export interface StorageCleanupCheckResult {
  totalObjectsScanned: number;
  validObjectsCount: number;
  orphanedObjectsCount: number;
  expiredObjectsCount: number;
  candidateFilesForCleanup: string[];
}
