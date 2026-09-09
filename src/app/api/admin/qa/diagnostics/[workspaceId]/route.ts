import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { getPrivacyRedactedContextSummary } from "@/services/admin/qaDiagnosticsService";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await requireAdminPermission("qa.view_health");
    const { workspaceId } = await context.params;

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: "Workspace ID required" }, { status: 400 });
    }

    const summary = await getPrivacyRedactedContextSummary(workspaceId);
    return NextResponse.json({ success: true, data: summary });
  } catch (err: any) {
    const status = err.name === "AdminUnauthorizedError" ? 401 : err.name === "AdminForbiddenError" ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
