import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { safeAdminRetryGeneration } from "@/services/admin/qaDiagnosticsService";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission("qa.retry_failed_generation");
    const body = await req.json().catch(() => ({}));
    const { workspaceId, reason } = body;

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: "Workspace ID required" }, { status: 400 });
    }

    const result = await safeAdminRetryGeneration(
      workspaceId,
      { adminId: admin.userId, adminEmail: admin.email },
      reason
    );

    return NextResponse.json({
      success: true,
      message: "Workspace preparation retried successfully",
      workspaceId: result.workspace.id,
      status: result.workspace.status,
      questionCount: result.questions.length,
    });
  } catch (err: any) {
    const status = err.name === "AdminUnauthorizedError" ? 401 : err.name === "AdminForbiddenError" ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
