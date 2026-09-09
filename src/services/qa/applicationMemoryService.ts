import { createClient } from "@/utils/supabase/server";
import { QAAuthorizationError, QANotFoundError } from "./qaContextBuilder";
import type { 
  ApplicationMemory, 
  UserCareerConfirmation, 
  ApplicationQAContext 
} from "@shared/types/qa";

/**
 * Deterministically calculates total years of experience from experience date ranges.
 * Parses years and handles 'present' / 'current' without double-counting overlapping intervals.
 */
export function calculateTotalExperienceYears(
  experienceList: { dates: string }[] | undefined | null
): number {
  if (!experienceList || experienceList.length === 0) {
    return 0;
  }

  const currentYear = new Date().getFullYear();
  const ranges: [number, number][] = [];

  for (const exp of experienceList) {
    if (!exp.dates || typeof exp.dates !== "string") continue;

    const lower = exp.dates.toLowerCase();
    const fourDigitYears = exp.dates.match(/\b(19\d\d|20\d\d)\b/g);

    if (fourDigitYears && fourDigitYears.length >= 2) {
      const start = parseInt(fourDigitYears[0], 10);
      const end = parseInt(fourDigitYears[1], 10);
      if (start <= end && start >= 1970 && end <= currentYear + 1) {
        ranges.push([start, end]);
      }
    } else if (fourDigitYears && fourDigitYears.length === 1) {
      const start = parseInt(fourDigitYears[0], 10);
      const end = (lower.includes("present") || lower.includes("current") || lower.includes("now"))
        ? currentYear
        : start + 1;
      if (start <= end && start >= 1970) {
        ranges.push([start, end]);
      }
    }
  }

  if (ranges.length === 0) {
    return experienceList.length; // Fallback estimate: 1 year per listed role if dates unparseable
  }

  // Merge overlapping intervals
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [ranges[0]];

  for (let i = 1; i < ranges.length; i++) {
    const current = ranges[i];
    const prev = merged[merged.length - 1];

    if (current[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  let totalYears = 0;
  for (const range of merged) {
    totalYears += Math.max(1, range[1] - range[0]);
  }

  return totalYears;
}

/**
 * Reconstructs the complete Application Memory for an application.
 * Distinguishes Historical Application Truth (what was submitted) vs Career Truth (current profile).
 */
export async function buildApplicationMemory(
  applicationId: string,
  authenticatedUserId: string,
  supabaseClient?: any
): Promise<ApplicationMemory> {
  const supabase = supabaseClient || (await createClient());

  // 1. Fetch application record
  const { data: application, error: appError } = await supabase
    .from("job_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (appError || !application) {
    throw new QANotFoundError(`Job application ${applicationId} not found`);
  }

  // 2. IDOR / Ownership authorization check
  if (application.user_id !== authenticatedUserId) {
    throw new QAAuthorizationError("You are not authorized to view Application Memory for this application");
  }

  const meta = application.metadata || {};
  const companyName = meta.company || meta.companyName || "Target Employer";
  const jobTitle = meta.title || meta.jobTitle || "Target Role";
  const appliedAt = application.created_at || new Date().toISOString();

  // 3. Resolve Application Truth (Submitted Snapshot)
  let submittedResumeContent: any = application.resume_snapshot || null;
  let hasSnapshot = !!application.resume_snapshot;

  // Fallback for legacy applications
  if (!submittedResumeContent && application.resume_id) {
    const { data: liveResume } = await supabase
      .from("resumes")
      .select("content, title")
      .eq("id", application.resume_id)
      .single();

    if (liveResume) {
      submittedResumeContent = liveResume.content;
    }
  }

  const submittedSkills: string[] = submittedResumeContent?.skills || [];
  const submittedExp: { company: string; role: string; dates: string }[] = (submittedResumeContent?.experience || []).map((exp: any) => ({
    company: exp.company || "",
    role: exp.role || "",
    dates: exp.dates || "",
  }));
  const submittedExpYears = calculateTotalExperienceYears(submittedExp);

  // Application-specific answers and statements
  const submittedAnswers: Record<string, string> = 
    meta.answers || 
    meta.application_answers || 
    meta.custom_answers || 
    {};

  const statedSalary = meta.salary || meta.expected_salary || meta.salary_expectation || submittedAnswers["salary"] || null;
  const statedNotice = meta.notice_period || meta.noticePeriod || submittedAnswers["notice_period"] || null;
  const statedAvailability = meta.availability || submittedAnswers["availability"] || null;
  const statedRelocation = meta.relocation || submittedAnswers["relocation"] || null;
  const statedAuth = meta.work_authorization || submittedAnswers["work_authorization"] || null;

  // 4. Resolve Career Truth (Current Live Profile / Resumes + Active Confirmations)
  const { data: latestResumes } = await supabase
    .from("resumes")
    .select("id, title, content, updated_at")
    .eq("user_id", authenticatedUserId)
    .order("updated_at", { ascending: false })
    .limit(1);

  const currentResume = latestResumes && latestResumes.length > 0 ? latestResumes[0] : null;
  const currentContent = currentResume?.content || submittedResumeContent || {};
  const currentSkills: string[] = currentContent?.skills || [];
  const currentExp: { company: string; role: string; dates: string }[] = (currentContent?.experience || []).map((exp: any) => ({
    company: exp.company || "",
    role: exp.role || "",
    dates: exp.dates || "",
  }));
  const currentExpYears = calculateTotalExperienceYears(currentExp);

  // Fetch active global career confirmations
  const { data: userConfirmations } = await supabase
    .from("user_career_confirmations")
    .select("*")
    .eq("user_id", authenticatedUserId)
    .order("created_at", { ascending: false });

  const activeConfirmations: UserCareerConfirmation[] = userConfirmations || [];

  // 5. Calculate Divergences between Application Truth and Career Truth
  const submittedSkillSet = new Set(submittedSkills.map((s: string) => s.toLowerCase()));
  const newSkills = currentSkills.filter((s: string) => !submittedSkillSet.has(s.toLowerCase()));

  const submittedRolesSet = new Set(submittedExp.map((e: { company: string; role: string }) => `${e.company.toLowerCase()}-${e.role.toLowerCase()}`));
  const modifiedRoles = currentExp
    .filter((e: { company: string; role: string }) => !submittedRolesSet.has(`${e.company.toLowerCase()}-${e.role.toLowerCase()}`))
    .map((e: { company: string; role: string }) => `${e.role} at ${e.company}`);

  return {
    applicationId,
    userId: authenticatedUserId,
    companyName,
    jobTitle,
    appliedAt,
    applicationTruth: {
      hasSubmittedSnapshot: hasSnapshot,
      submittedResumeTitle: meta.resume_title || submittedResumeContent?.title || null,
      statedSalaryExpectation: statedSalary,
      statedAvailability: statedAvailability,
      statedNoticePeriod: statedNotice,
      statedRelocation: statedRelocation,
      statedWorkAuthorization: statedAuth,
      submittedSkills,
      submittedExperienceYears: submittedExpYears,
      submittedExperienceRoles: submittedExp,
      submittedApplicationAnswers: submittedAnswers,
    },
    careerTruth: {
      currentResumeTitle: currentResume?.title || null,
      currentSkills,
      currentExperienceYears: currentExpYears,
      currentExperienceRoles: currentExp,
      activeConfirmations,
    },
    divergences: {
      experienceYearsDiff: currentExpYears - submittedExpYears,
      newSkillsAddedSinceSubmission: newSkills,
      rolesModifiedSinceSubmission: modifiedRoles,
      salaryRangeChanged: false,
    },
    provenance: {
      sourceSnapshotId: application.resume_id || null,
      isHistoricalImmutable: hasSnapshot,
      reconstructedAt: new Date().toISOString(),
    },
  };
}
