import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { getAdminAuditLogs } from "@/services/admin/qaAuditService";

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission("qa.view_health");
    const { searchParams } = new URL(req.url);

    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const actionFilter = searchParams.get("action") || undefined;
    const emailFilter = searchParams.get("email") || undefined;

    const result = await getAdminAuditLogs({
      limit,
      offset,
      actionFilter,
      adminEmailFilter: emailFilter,
    });

    return NextResponse.json({ success: true, data: result.logs, total: result.total });
  } catch (err: any) {
    const status = err.name === "AdminUnauthorizedError" ? 401 : err.name === "AdminForbiddenError" ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
