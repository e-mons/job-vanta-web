import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { createAdminClient } from "@/utils/supabase/admin";
import { recordAdminAuditLog } from "@/services/admin/qaAuditService";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission("qa.exceptional_content_access");
    const body = await req.json().catch(() => ({}));
    const { workspaceId, reason, supportTicketRef } = body;

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: "Workspace ID required" }, { status: 400 });
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Explicit formal reason (min 10 characters) required for exceptional access" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Fetch questions and answers for this workspace only
    const { data: questions, error } = await adminClient
      .from("qa_questions")
      .select(`
        id,
        question_text,
        category,
        risk_level,
        answer:qa_answers(
          id,
          suggested_normal,
          user_edited_answer,
          active_version,
          truth_status
        )
      `)
      .eq("workspace_id", workspaceId)
      .limit(10);

    if (error) {
      throw new Error(`Failed to retrieve workspace data: ${error.message}`);
    }

    // Record immutable audit log of this exceptional access
    await recordAdminAuditLog({
      adminId: admin.userId,
      adminEmail: admin.email,
      action: "view_exceptional_content",
      targetType: "application_qa_workspaces",
      targetId: workspaceId,
      details: {
        supportTicketRef: supportTicketRef || null,
        accessedQuestionCount: (questions || []).length,
      },
      reason: `Formal support review: ${reason}`,
    });

    return NextResponse.json({
      success: true,
      message: "Exceptional access granted and audited",
      data: questions,
    });
  } catch (err: any) {
    const status = err.name === "AdminUnauthorizedError" ? 401 : err.name === "AdminForbiddenError" ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
