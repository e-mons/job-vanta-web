import { createAdminClient } from "@/utils/supabase/admin";
import type { QAAdminAuditLog } from "@shared/types/adminQa";

export interface CreateAuditLogParams {
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, any>;
  reason?: string | null;
  ipAddress?: string | null;
}

/**
 * Records an immutable administrative audit log.
 * Strictly adheres to Privacy Lock: Never records raw resumes, full answers, or private career text.
 */
export async function recordAdminAuditLog(params: CreateAuditLogParams): Promise<QAAdminAuditLog | null> {
  try {
    const adminClient = createAdminClient();
    
    // Sanitize details to ensure no private payload leakage
    const sanitizedDetails = { ...params.details };
    delete sanitizedDetails.resumeContent;
    delete sanitizedDetails.rawAnswer;
    delete sanitizedDetails.userEditedText;
    delete sanitizedDetails.transcript;
    delete sanitizedDetails.audioBuffer;

    const { data, error } = await adminClient
      .from("qa_admin_audit_logs")
      .insert({
        admin_id: params.adminId,
        admin_email: params.adminEmail,
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId,
        details: sanitizedDetails,
        reason: params.reason || null,
        ip_address: params.ipAddress || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[QA Admin Audit] Failed to write audit log:", error.message);
      return null;
    }

    return data as QAAdminAuditLog;
  } catch (err: any) {
    console.error("[QA Admin Audit] Unexpected audit logging failure:", err?.message);
    return null;
  }
}

/**
 * Retrieves paginated audit logs for administrators with qa.view_health permission.
 */
export async function getAdminAuditLogs(options: {
  limit?: number;
  offset?: number;
  actionFilter?: string;
  adminEmailFilter?: string;
}): Promise<{ logs: QAAdminAuditLog[]; total: number }> {
  const adminClient = createAdminClient();
  const limit = Math.min(options.limit || 50, 100);
  const offset = options.offset || 0;

  let query = adminClient
    .from("qa_admin_audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.actionFilter) {
    query = query.eq("action", options.actionFilter);
  }
  if (options.adminEmailFilter) {
    query = query.ilike("admin_email", `%${options.adminEmailFilter}%`);
  }

  const { data, count, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  return {
    logs: (data || []) as QAAdminAuditLog[],
    total: count || 0,
  };
}
