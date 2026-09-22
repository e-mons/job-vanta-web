import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { AdminFinancialService } from "@/services/admin/adminFinancialService";

export async function GET(req: NextRequest) {
  try {
    // Requires admin session
    await requireAdminPermission();

    const overview = await AdminFinancialService.getExecutiveOverview();

    return NextResponse.json({
      success: true,
      data: overview,
    });
  } catch (err: any) {
    console.error("Admin financial overview error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load financial overview" },
      { status: err.name === "AdminForbiddenError" ? 403 : 401 }
    );
  }
}
