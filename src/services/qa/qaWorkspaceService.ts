import { createClient } from "@/utils/supabase/server";
import { buildApplicationQAContext, QAAuthorizationError, QANotFoundError } from "./qaContextBuilder";
import type { QAWorkspace, QAStage } from "@shared/types/qa";

export interface GetOrCreateWorkspaceResult {
  workspace: QAWorkspace;
  stages: QAStage[];
  isNew: boolean;
  contextHash: string;
}

/**
 * Idempotently retrieves or creates a QA Workspace and initial stages for a given job application.
 * Prevents race conditions and duplicate entries via database uniqueness.
 */
export async function getOrCreateQAWorkspace(
  applicationId: string,
  authenticatedUserId: string,
  customSupabaseClient?: any
): Promise<GetOrCreateWorkspaceResult> {
  const supabase = customSupabaseClient || (await createClient());

  // 1. Build and verify authoritative context (handles ownership verification)
  const context = await buildApplicationQAContext(applicationId, authenticatedUserId, supabase);

  // 2. Check for existing workspace
  const { data: existingWorkspace, error: fetchError } = await supabase
    .from("application_qa_workspaces")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw new Error(`Failed to query QA workspace: ${fetchError.message}`);
  }

  if (existingWorkspace) {
    if (existingWorkspace.user_id !== authenticatedUserId) {
      throw new QAAuthorizationError("Access denied to this QA workspace");
    }

    // Check if source hash has changed (stale detection)
    let workspaceRecord = existingWorkspace;
    if (workspaceRecord.source_hash && workspaceRecord.source_hash !== context.sourceHash) {
      if (!workspaceRecord.is_stale) {
        const { data: updated } = await supabase
          .from("application_qa_workspaces")
          .update({
            is_stale: true,
            stale_reason: "Application context or resume updated since last preparation",
            updated_at: new Date().toISOString(),
          })
          .eq("id", workspaceRecord.id)
          .select()
          .single();
        if (updated) workspaceRecord = updated;
      }
    }

    // Fetch associated stages
    const { data: stages } = await supabase
      .from("qa_preparation_stages")
      .select("*")
      .eq("workspace_id", workspaceRecord.id)
      .order("stage_order", { ascending: true });

    return {
      workspace: workspaceRecord,
      stages: stages || [],
      isNew: false,
      contextHash: context.sourceHash,
    };
  }

  // 3. Workspace does not exist: Create it idempotently
  const { data: newWorkspace, error: insertError } = await supabase
    .from("application_qa_workspaces")
    .insert({
      application_id: applicationId,
      user_id: authenticatedUserId,
      status: "not_prepared",
      source_hash: context.sourceHash,
      is_stale: false,
    })
    .select()
    .single();

  if (insertError) {
    // If a concurrent request inserted in the microsecond interval, fetch that row
    if (insertError.code === "23505") {
      const { data: retryWorkspace } = await supabase
        .from("application_qa_workspaces")
        .select("*")
        .eq("application_id", applicationId)
        .single();
      if (retryWorkspace) {
        const { data: retryStages } = await supabase
          .from("qa_preparation_stages")
          .select("*")
          .eq("workspace_id", retryWorkspace.id)
          .order("stage_order", { ascending: true });

        return {
          workspace: retryWorkspace,
          stages: retryStages || [],
          isNew: false,
          contextHash: context.sourceHash,
        };
      }
    }
    throw new Error(`Failed to create QA workspace: ${insertError.message}`);
  }

  // 4. Initialize standard default stages for the new workspace
  const defaultStages = [
    {
      workspace_id: newWorkspace.id,
      user_id: authenticatedUserId,
      stage_type: "application",
      stage_order: 1,
      title: "Application & Resume Deep-Dive",
      status: "not_started",
    },
    {
      workspace_id: newWorkspace.id,
      user_id: authenticatedUserId,
      stage_type: "recruiter_screening",
      stage_order: 2,
      title: "Recruiter & Initial Screening",
      status: "not_started",
    },
    {
      workspace_id: newWorkspace.id,
      user_id: authenticatedUserId,
      stage_type: "technical_interview",
      stage_order: 3,
      title: "Technical & Role Competency",
      status: "not_started",
    },
    {
      workspace_id: newWorkspace.id,
      user_id: authenticatedUserId,
      stage_type: "hiring_manager",
      stage_order: 4,
      title: "Hiring Manager & Leadership Round",
      status: "not_started",
    },
  ];

  const { data: createdStages, error: stagesError } = await supabase
    .from("qa_preparation_stages")
    .insert(defaultStages)
    .select();

  if (stagesError) {
    console.warn(`[QA] Failed to initialize default stages for workspace ${newWorkspace.id}:`, stagesError.message);
  }

  return {
    workspace: newWorkspace,
    stages: createdStages || [],
    isNew: true,
    contextHash: context.sourceHash,
  };
}
