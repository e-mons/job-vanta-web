import { createAdminClient } from "@/utils/supabase/admin";
import { recordAdminAuditLog } from "./qaAuditService";
import { prepareApplicationQA } from "../qa/qaEngineService";
import { getQASettings } from "./qaSettingsService";
import type { 
  SafeDiagnosticSummary, 
  StorageCleanupCheckResult, 
  QAErrorCategory 
} from "@shared/types/adminQa";

/**
 * Returns a strictly privacy-redacted diagnostic summary for support diagnostics.
 * NEVER returns raw resume text, generated answers, or sensitive career details.
 */
export async function getPrivacyRedactedContextSummary(workspaceId: string): Promise<SafeDiagnosticSummary> {
  const adminClient = createAdminClient();

  // 1. Fetch workspace and application parent
  const { data: ws, error: wsError } = await adminClient
    .from("application_qa_workspaces")
    .select(`
      id,
      application_id,
      user_id,
      status,
      stale_reason,
      application:job_applications(
        id,
        status,
        job_title,
        company_name,
        job_description,
        resume_snapshot,
        resume_id
      )
    `)
    .eq("id", workspaceId)
    .single();

  if (wsError || !ws) {
    throw new Error(`Workspace not found: ${workspaceId}`);
  }

  const app: any = ws.application;
  const resumeSnapshot = app?.resume_snapshot;

  // 2. Determine presence of resume
  let resumeAvailable = false;
  let experienceCount = 0;
  let skillsCount = 0;

  if (resumeSnapshot?.content) {
    resumeAvailable = true;
    experienceCount = Array.isArray(resumeSnapshot.content.experience) ? resumeSnapshot.content.experience.length : 0;
    skillsCount = Array.isArray(resumeSnapshot.content.skills) ? resumeSnapshot.content.skills.length : 0;
  } else if (app?.resume_id) {
    const { data: resData } = await adminClient
      .from("resumes")
      .select("content")
      .eq("id", app.resume_id)
      .single();

    if (resData?.content) {
      resumeAvailable = true;
      experienceCount = Array.isArray(resData.content.experience) ? resData.content.experience.length : 0;
      skillsCount = Array.isArray(resData.content.skills) ? resData.content.skills.length : 0;
    }
  }

  const jdLength = (app?.job_description || "").length;
  const appAnswersCount = app?.answers ? Object.keys(app.answers).length : 0;

  // 3. Fetch latest telemetry log for this workspace
  const { data: latestLog } = await adminClient
    .from("qa_generation_logs")
    .select("status, error_category, error_message, platform, retry_count")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const retryEligible = ws.status === "failed" || ws.status === "stale" || ws.status === "not_prepared";

  return {
    workspaceId: ws.id,
    applicationId: ws.application_id,
    status: ws.status,
    stageTitle: app?.status || "application",
    platform: (latestLog?.platform as any) || "web",
    resumeAvailable,
    experienceRecordsCount: experienceCount,
    skillsCount,
    jobDescriptionLength: jdLength,
    applicationAnswersCount: appAnswersCount,
    lastErrorCategory: (latestLog?.error_category as QAErrorCategory) || null,
    lastErrorMessage: latestLog?.error_message || ws.stale_reason || null,
    retryEligible,
    attemptsCount: (latestLog?.retry_count || 0) + 1,
  };
}

/**
 * Safely triggers an administrative retry for a failed generation.
 * Adheres strictly to Prompt 2 idempotency: reuses existing workspace, preserves user custom answers,
 * and passes through Truth Lock verification.
 */
export async function safeAdminRetryGeneration(
  workspaceId: string,
  adminContext: { adminId: string; adminEmail: string },
  reason?: string
) {
  const adminClient = createAdminClient();

  const { data: ws, error } = await adminClient
    .from("application_qa_workspaces")
    .select("id, application_id, user_id, status")
    .eq("id", workspaceId)
    .single();

  if (error || !ws) {
    throw new Error(`Workspace not found: ${workspaceId}`);
  }

  // Execute server-side preparation with forceRegenerate=true
  const result = await prepareApplicationQA(
    ws.application_id,
    ws.user_id,
    {
      forceRegenerate: true,
      customSupabaseClient: adminClient,
    }
  );

  // Record audit log
  await recordAdminAuditLog({
    adminId: adminContext.adminId,
    adminEmail: adminContext.adminEmail,
    action: "retry_generation",
    targetType: "application_qa_workspaces",
    targetId: workspaceId,
    details: {
      applicationId: ws.application_id,
      previousStatus: ws.status,
      newStatus: result.workspace.status,
      questionCount: result.questions.length,
    },
    reason: reason || "Administrative recovery of failed generation",
  });

  return result;
}

/**
 * Scans the qa_practice_audio storage bucket for orphaned or expired files.
 */
export async function detectStorageOrphans(): Promise<StorageCleanupCheckResult> {
  const adminClient = createAdminClient();
  const settings = await getQASettings();
  const retentionMs = settings.audio_retention_hours * 60 * 60 * 1000;
  const cutoffTime = Date.now() - retentionMs;

  // List files in qa_practice_audio
  const { data: fileList, error } = await adminClient.storage
    .from("qa_practice_audio")
    .list();

  if (error || !fileList) {
    return {
      totalObjectsScanned: 0,
      validObjectsCount: 0,
      orphanedObjectsCount: 0,
      expiredObjectsCount: 0,
      candidateFilesForCleanup: [],
    };
  }

  const candidateFiles: string[] = [];
  let expiredCount = 0;
  let orphanCount = 0;

  // Check each file against attempts table
  for (const file of fileList) {
    if (!file.name || file.name.startsWith(".")) continue;

    const fileCreatedAt = file.created_at ? new Date(file.created_at).getTime() : 0;
    const isExpired = fileCreatedAt > 0 && fileCreatedAt < cutoffTime;

    // Check if matching practice attempt exists
    const { data: attempt } = await adminClient
      .from("qa_practice_attempts")
      .select("id")
      .ilike("audio_storage_path", `%${file.name}%`)
      .limit(1)
      .single();

    if (!attempt) {
      orphanCount++;
      candidateFiles.push(file.name);
    } else if (isExpired) {
      expiredCount++;
      candidateFiles.push(file.name);
    }
  }

  return {
    totalObjectsScanned: fileList.length,
    validObjectsCount: fileList.length - candidateFiles.length,
    orphanedObjectsCount: orphanCount,
    expiredObjectsCount: expiredCount,
    candidateFilesForCleanup: candidateFiles,
  };
}

/**
 * Safely removes verified orphan/expired audio files from storage.
 */
export async function runSafeOrphanCleanup(
  adminContext: { adminId: string; adminEmail: string },
  reason?: string
): Promise<{ cleanedCount: number; errorsCount: number }> {
  const adminClient = createAdminClient();
  const checkResult = await detectStorageOrphans();

  if (checkResult.candidateFilesForCleanup.length === 0) {
    return { cleanedCount: 0, errorsCount: 0 };
  }

  const filesToDelete = checkResult.candidateFilesForCleanup;
  const { error } = await adminClient.storage
    .from("qa_practice_audio")
    .remove(filesToDelete);

  let cleanedCount = filesToDelete.length;
  let errorsCount = 0;

  if (error) {
    console.error("[QA Storage Cleanup] Batch delete error:", error.message);
    errorsCount = filesToDelete.length;
    cleanedCount = 0;
  }

  // Record audit log
  await recordAdminAuditLog({
    adminId: adminContext.adminId,
    adminEmail: adminContext.adminEmail,
    action: "orphan_cleanup",
    targetType: "storage.qa_practice_audio",
    targetId: "batch_cleanup",
    details: {
      candidatesScanned: checkResult.totalObjectsScanned,
      cleanedFiles: cleanedCount,
      errorsCount,
    },
    reason: reason || "Scheduled storage orphan cleanup",
  });

  return { cleanedCount, errorsCount };
}
