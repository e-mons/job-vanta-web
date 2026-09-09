import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { getGenerationLogs } from "@/services/admin/qaTelemetryService";

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission("qa.view_usage");
    const { searchParams } = new URL(req.url);

    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const platform = searchParams.get("platform") as any;
    const feature = searchParams.get("feature") as any;
    const statusFilter = searchParams.get("status") as any;
    const errorCategory = searchParams.get("errorCategory") as any;
    const modelName = searchParams.get("modelName") || undefined;

    const result = await getGenerationLogs({
      limit,
      offset,
      platform: platform || undefined,
      feature: feature || undefined,
      status: statusFilter || undefined,
      errorCategory: errorCategory || undefined,
      modelName,
    });

    return NextResponse.json({ success: true, data: result.logs, total: result.total });
  } catch (err: any) {
    const status = err.name === "AdminUnauthorizedError" ? 401 : err.name === "AdminForbiddenError" ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
