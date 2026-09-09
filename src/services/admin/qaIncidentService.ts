import { createAdminClient } from "@/utils/supabase/admin";
import { recordAdminAuditLog } from "./qaAuditService";
import type { 
  QAIncident, 
  IncidentSeverity, 
  IncidentStatus 
} from "@shared/types/adminQa";

export interface CreateIncidentParams {
  title: string;
  description: string;
  severity: IncidentSeverity;
  status?: IncidentStatus;
  impactedSubsystems?: string[];
  userNotice?: string | null;
}

/**
 * Creates a new Q&A operational incident.
 */
export async function createQAIncident(
  params: CreateIncidentParams,
  adminContext: { adminId: string; adminEmail: string }
): Promise<QAIncident> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("qa_incidents")
    .insert({
      title: params.title,
      description: params.description,
      severity: params.severity,
      status: params.status || "investigating",
      impacted_subsystems: params.impactedSubsystems || [],
      user_notice: params.userNotice || null,
      created_by: adminContext.adminId,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create incident: ${error?.message || "Database error"}`);
  }

  await recordAdminAuditLog({
    adminId: adminContext.adminId,
    adminEmail: adminContext.adminEmail,
    action: "create_incident",
    targetType: "qa_incidents",
    targetId: data.id,
    details: {
      title: params.title,
      severity: params.severity,
      status: data.status,
      impactedSubsystems: params.impactedSubsystems,
    },
    reason: "New incident opened",
  });

  return data as QAIncident;
}

/**
 * Updates an operational incident status, user notice, or resolution.
 */
export async function updateQAIncident(
  incidentId: string,
  updates: Partial<Pick<QAIncident, "title" | "description" | "severity" | "status" | "impacted_subsystems" | "user_notice">>,
  adminContext: { adminId: string; adminEmail: string },
  reason?: string
): Promise<QAIncident> {
  const adminClient = createAdminClient();

  const payload: any = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (updates.status === "resolved") {
    payload.resolved_at = new Date().toISOString();
  }

  const { data, error } = await adminClient
    .from("qa_incidents")
    .update(payload)
    .eq("id", incidentId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update incident: ${error?.message || "Database error"}`);
  }

  await recordAdminAuditLog({
    adminId: adminContext.adminId,
    adminEmail: adminContext.adminEmail,
    action: "update_incident",
    targetType: "qa_incidents",
    targetId: incidentId,
    details: {
      updates,
      newStatus: data.status,
    },
    reason: reason || "Incident updated",
  });

  return data as QAIncident;
}

/**
 * Fetches all incidents.
 */
export async function getQAIncidents(options: {
  status?: IncidentStatus;
  limit?: number;
}): Promise<QAIncident[]> {
  const adminClient = createAdminClient();
  let query = adminClient
    .from("qa_incidents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options.limit || 50);

  if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch incidents: ${error.message}`);
  }

  return (data || []) as QAIncident[];
}

/**
 * Links a telemetry generation log or workspace to an incident.
 */
export async function linkLogToIncident(
  incidentId: string,
  logId?: string | null,
  workspaceId?: string | null
) {
  const adminClient = createAdminClient();
  await adminClient.from("qa_incident_links").insert({
    incident_id: incidentId,
    log_id: logId || null,
    workspace_id: workspaceId || null,
  });
}
