import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { createAdminClient } from "@/utils/supabase/admin";
import { recordAdminAuditLog } from "@/services/admin/qaAuditService";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminPermission("qa.view_quality_samples");
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const { status = "resolved", notes } = body;

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("qa_quality_reports")
      .update({
        status,
        safe_notes: notes || null,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update quality report: ${error?.message || "Report not found"}`);
    }

    await recordAdminAuditLog({
      adminId: admin.userId,
      adminEmail: admin.email,
      action: "resolve_quality_report",
      targetType: "qa_quality_reports",
      targetId: id,
      details: { newStatus: status, notes },
      reason: "Quality report updated by administrator",
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    const status = err.name === "AdminUnauthorizedError" ? 401 : err.name === "AdminForbiddenError" ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
