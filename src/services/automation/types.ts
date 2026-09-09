export type PlatformType = "greenhouse" | "lever" | "workable" | "wellfound" | "generic";

/**
 * Canonical 8-phase Application & Automation Status Model
 */
export type CanonicalApplicationStatus =
  | "ready_to_apply"
  | "checking"
  | "needs_info"
  | "queued"
  | "applying"
  | "action_required"
  | "submitted"
  | "failed";

export interface StatusMetadata {
  key: CanonicalApplicationStatus;
  label: string;
  description: string;
  actionLabel: string | null;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

/**
 * Maps any raw database status to our canonical 8-phase status
 */
export function mapToCanonicalStatus(rawStatus?: string | null): CanonicalApplicationStatus {
  if (!rawStatus) return "ready_to_apply";
  const s = rawStatus.toLowerCase().trim();

  switch (s) {
    case "checking":
    case "detecting_fields":
    case "scanning":
      return "checking";

    case "needs_info":
    case "missing_info":
    case "action_needed":
      return "needs_info";

    case "queued":
    case "ready_to_submit":
    case "scheduled":
      return "queued";

    case "applying":
    case "submitting":
    case "in_progress":
      return "applying";

    case "action_required":
    case "captcha":
    case "blocked":
      return "action_required";

    case "submitted":
    case "applied":
    case "completed":
      return "submitted";

    case "failed":
    case "error":
    case "rejected":
      return "failed";

    case "ready_to_apply":
    default:
      return "ready_to_apply";
  }
}

/**
 * Get user-friendly, plain-English presentation details for each canonical status
 */
export function getApplicationStatusMeta(status: CanonicalApplicationStatus | string): StatusMetadata {
  const canonical = mapToCanonicalStatus(status);

  switch (canonical) {
    case "checking":
      return {
        key: "checking",
        label: "Checking Application",
        description: "Jobvanta is inspecting form requirements and screening questions.",
        actionLabel: null,
        badgeBg: "bg-purple-50",
        badgeText: "text-purple-700",
        badgeBorder: "border-purple-200",
      };

    case "needs_info":
      return {
        key: "needs_info",
        label: "Needs Information",
        description: "A few required details are needed before submission.",
        actionLabel: "Complete & Continue",
        badgeBg: "bg-amber-50",
        badgeText: "text-amber-800",
        badgeBorder: "border-amber-300",
      };

    case "queued":
      return {
        key: "queued",
        label: "Queued",
        description: "Waiting in queue for cloud browser execution.",
        actionLabel: null,
        badgeBg: "bg-blue-50",
        badgeText: "text-blue-700",
        badgeBorder: "border-blue-200",
      };

    case "applying":
      return {
        key: "applying",
        label: "Applying",
        description: "Jobvanta is completing the application now.",
        actionLabel: "View Live Progress",
        badgeBg: "bg-indigo-50",
        badgeText: "text-indigo-700",
        badgeBorder: "border-indigo-200",
      };

    case "action_required":
      return {
        key: "action_required",
        label: "Action Required",
        description: "Employer requires manual verification or security check (e.g. CAPTCHA).",
        actionLabel: "Open Application",
        badgeBg: "bg-orange-50",
        badgeText: "text-orange-800",
        badgeBorder: "border-orange-300",
      };

    case "submitted":
      return {
        key: "submitted",
        label: "Submitted",
        description: "Application submitted successfully.",
        actionLabel: "Prepare Me",
        badgeBg: "bg-emerald-50",
        badgeText: "text-emerald-700",
        badgeBorder: "border-emerald-200",
      };

    case "failed":
      return {
        key: "failed",
        label: "Failed",
        description: "We couldn't complete this application.",
        actionLabel: "Retry",
        badgeBg: "bg-rose-50",
        badgeText: "text-rose-700",
        badgeBorder: "border-rose-200",
      };

    case "ready_to_apply":
    default:
      return {
        key: "ready_to_apply",
        label: "Ready to Apply",
        description: "Ready for automated or manual application.",
        actionLabel: "Apply Automatically",
        badgeBg: "bg-slate-50",
        badgeText: "text-slate-700",
        badgeBorder: "border-slate-200",
      };
  }
}

export type FieldInputType = 
  | "text" 
  | "email" 
  | "tel" 
  | "textarea" 
  | "select" 
  | "choice" 
  | "yes_no" 
  | "number" 
  | "date" 
  | "file";

export interface FormFieldDefinition {
  fieldKey: string;
  label: string;
  type: FieldInputType;
  required: boolean;
  options?: string[];
  description?: string;
  value?: string;
  reusable?: boolean;
}

export interface UserApplicationDetails {
  user_id: string;
  work_authorization?: string | null;
  requires_sponsorship?: string | null;
  notice_period?: string | null;
  salary_expectation?: string | null;
  willing_to_relocate?: string | null;
  custom_answers?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface DetectionResult {
  platform: PlatformType;
  sessionId: string;
  detectedFields: FormFieldDefinition[];
  missingFields: FormFieldDefinition[];
  readyToSubmit: boolean;
  actionRequiredReason?: string | null;
}

export interface SubmissionResult {
  success: boolean;
  sessionId: string;
  confirmationMessage?: string;
  error?: string;
  actionRequired?: boolean;
  actionRequiredReason?: string;
}

/**
 * Detect the target job platform from URL
 */
export function detectPlatform(url: string): PlatformType {
  const lower = url.toLowerCase();
  if (lower.includes("greenhouse.io")) return "greenhouse";
  if (lower.includes("lever.co")) return "lever";
  if (lower.includes("workable.com")) return "workable";
  if (lower.includes("wellfound.com")) return "wellfound";
  return "generic";
}
