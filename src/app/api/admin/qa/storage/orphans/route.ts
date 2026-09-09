import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { detectStorageOrphans } from "@/services/admin/qaDiagnosticsService";

export async function GET() {
  try {
    await requireAdminPermission("qa.view_health");
    const result = await detectStorageOrphans();
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    const status = err.name === "AdminUnauthorizedError" ? 401 : err.name === "AdminForbiddenError" ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
