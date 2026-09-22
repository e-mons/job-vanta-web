import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { AdminFinancialService } from "@/services/admin/adminFinancialService";

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission();

    const telemetry = await AdminFinancialService.getAICostTelemetry();

    return NextResponse.json({
      success: true,
      telemetry,
    });
  } catch (err: any) {
    console.error("Admin AI costs error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load AI cost telemetry" },
      { status: err.name === "AdminForbiddenError" ? 403 : 401 }
    );
  }
}
