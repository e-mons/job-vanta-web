import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { getSystemHealthOverview } from "@/services/admin/qaTelemetryService";

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission("qa.view_health");
    const { searchParams } = new URL(req.url);
    const timeRange = (searchParams.get("range") || "today") as "today" | "7d" | "30d";

    const overview = await getSystemHealthOverview(timeRange);
    return NextResponse.json({ success: true, data: overview });
  } catch (err: any) {
    const status = err.name === "AdminUnauthorizedError" ? 401 : err.name === "AdminForbiddenError" ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
