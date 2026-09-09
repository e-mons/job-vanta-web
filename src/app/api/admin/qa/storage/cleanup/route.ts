import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { runSafeOrphanCleanup } from "@/services/admin/qaDiagnosticsService";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission("qa.manage_settings");
    const body = await req.json().catch(() => ({}));
    const { reason } = body;

    const result = await runSafeOrphanCleanup(
      { adminId: admin.userId, adminEmail: admin.email },
      reason
    );

    return NextResponse.json({
      success: true,
      message: `Cleaned ${result.cleanedCount} orphan/expired audio files`,
      cleanedCount: result.cleanedCount,
      errorsCount: result.errorsCount,
    });
  } catch (err: any) {
    const status = err.name === "AdminUnauthorizedError" ? 401 : err.name === "AdminForbiddenError" ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
