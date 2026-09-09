import { createHash } from "crypto";
import { createClient } from "@/utils/supabase/server";
import type { ApplicationQAContext } from "@shared/types/qa";

export class QAAuthorizationError extends Error {
  constructor(message = "Unauthorized to access this application context") {
    super(message);
    this.name = "QAAuthorizationError";
    Object.setPrototypeOf(this, QAAuthorizationError.prototype);
  }
}

export class QANotFoundError extends Error {
  constructor(message = "Application not found") {
    super(message);
    this.name = "QANotFoundError";
    Object.setPrototypeOf(this, QANotFoundError.prototype);
  }
}

/**
 * Deterministically computes SHA-256 hash of normalized application context.
 */
export function computeQASourceHash(payload: Record<string, any>): string {
  const normalizedString = JSON.stringify(payload, Object.keys(payload).sort());
  return createHash("sha256").update(normalizedString).digest("hex");
}

/**
 * Builds the authoritative, sanitized QA context for an application.
 * Verifies application ownership and resolves submitted resume snapshot (or live fallback),
 * job specifications, and relevant career evidence.
 */
export async function buildApplicationQAContext(
  applicationId: string,
  authenticatedUserId: string,
  customSupabaseClient?: any
): Promise<ApplicationQAContext> {
  if (!applicationId || !authenticatedUserId) {
    throw new QAAuthorizationError("Invalid application or user identifier");
  }

  const supabase = customSupabaseClient || (await createClient());

  // 1. Fetch application record
  const { data: application, error: appError } = await supabase
    .from("job_applications")
    .select("id, user_id, resume_id, status, metadata, resume_snapshot, created_at, updated_at")
    .eq("id", applicationId)
    .single();

  if (appError || !application) {
    throw new QANotFoundError(`Application with ID "${applicationId}" not found`);
  }

  // 2. Strict IDOR / Ownership verification
  if (application.user_id !== authenticatedUserId) {
    throw new QAAuthorizationError("You do not have permission to prepare Q&A for this application");
  }

  const metadata = (application.metadata && typeof application.metadata === "object") 
    ? application.metadata 
    : {};

  // 3. Resolve Resume Data (Priority: Immutable Snapshot > Live Resume Record)
  let rawResumeContent: any = null;
  let resumeTitle: string | null = null;
  let isSnapshot = false;

  if (application.resume_snapshot) {
    rawResumeContent = application.resume_snapshot;
    resumeTitle = metadata.resumeTitle || "Submitted Application Resume";
    isSnapshot = true;
  } else if (application.resume_id) {
    const { data: resume } = await supabase
      .from("resumes")
      .select("id, title, content")
      .eq("id", application.resume_id)
      .single();

    if (resume) {
      rawResumeContent = resume.content;
      resumeTitle = resume.title;
    }
  }

  // 4. Sanitize and structure resume data (strip photos / sensitive bloat)
  let structuredResume: ApplicationQAContext["resume"] = null;

  if (rawResumeContent && typeof rawResumeContent === "object") {
    const pInfo = rawResumeContent.personalInfo || {};
    structuredResume = {
      id: application.resume_id || null,
      title: resumeTitle,
      isSnapshot,
      personalInfo: {
        fullName: pInfo.fullName || undefined,
        email: pInfo.email || undefined,
        phone: pInfo.phone || undefined,
        location: pInfo.location || undefined,
        summary: pInfo.summary || undefined,
        website: pInfo.website || undefined,
      },
      skills: Array.isArray(rawResumeContent.skills) ? rawResumeContent.skills : [],
      experience: Array.isArray(rawResumeContent.experience)
        ? rawResumeContent.experience.map((exp: any) => ({
            company: String(exp.company || ""),
            role: String(exp.role || ""),
            dates: String(exp.dates || ""),
            bullets: Array.isArray(exp.bullets) ? exp.bullets : [],
          }))
        : [],
      education: Array.isArray(rawResumeContent.education)
        ? rawResumeContent.education.map((edu: any) => ({
            school: String(edu.school || ""),
            degree: String(edu.degree || ""),
            year: String(edu.year || ""),
          }))
        : [],
      projects: Array.isArray(rawResumeContent.projects)
        ? rawResumeContent.projects.map((proj: any) => ({
            name: String(proj.name || ""),
            description: String(proj.description || ""),
            technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
          }))
        : undefined,
      certifications: Array.isArray(rawResumeContent.certifications)
        ? rawResumeContent.certifications.map((cert: any) => ({
            name: String(cert.name || ""),
            issuer: String(cert.issuer || ""),
            date: String(cert.date || ""),
          }))
        : undefined,
    };
  }

  // 5. Sanitize and structure Job Data
  const structuredJob: ApplicationQAContext["job"] = {
    title: String(metadata.title || "Target Role"),
    company: String(metadata.company || "Hiring Company"),
    location: metadata.location ? String(metadata.location) : null,
    type: metadata.type ? String(metadata.type) : null,
    salary: metadata.salary ? String(metadata.salary) : null,
    description: metadata.description ? String(metadata.description) : null,
    requirements: Array.isArray(metadata.requirements) ? metadata.requirements : undefined,
    responsibilities: Array.isArray(metadata.responsibilities) ? metadata.responsibilities : undefined,
    skills: Array.isArray(metadata.skills) ? metadata.skills : undefined,
    applyLink: metadata.applyLink ? String(metadata.applyLink) : null,
  };

  // 6. Optional: Fetch matching cover letter if one was generated for this target company / role
  let structuredCoverLetter: ApplicationQAContext["coverLetter"] = null;
  if (metadata.company) {
    const { data: coverLetter } = await supabase
      .from("cover_letters")
      .select("title, content")
      .eq("user_id", authenticatedUserId)
      .ilike("company_name", `%${metadata.company}%`)
      .limit(1)
      .maybeSingle();

    if (coverLetter) {
      structuredCoverLetter = {
        title: coverLetter.title,
        content: coverLetter.content,
      };
    }
  }

  // 7. Compute deterministic source hash for stale detection
  const hashPayload = {
    job: structuredJob,
    resume: structuredResume,
    coverLetter: structuredCoverLetter,
  };
  const sourceHash = computeQASourceHash(hashPayload);

  return {
    applicationId: application.id,
    userId: application.user_id,
    status: application.status || "applied",
    appliedAt: application.created_at,
    job: structuredJob,
    resume: structuredResume,
    coverLetter: structuredCoverLetter,
    sourceHash,
  };
}
