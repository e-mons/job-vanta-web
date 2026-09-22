import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { AdminFinancialService } from "@/services/admin/adminFinancialService";

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission();

    const quotas = await AdminFinancialService.getSystemQuotas();

    return NextResponse.json({
      success: true,
      quotas,
    });
  } catch (err: any) {
    console.error("Admin get quotas error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load system quotas" },
      { status: err.name === "AdminForbiddenError" ? 403 : 401 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminPermission();

    const body = await req.json();
    const updated = await AdminFinancialService.updateSystemQuotas(body);

    return NextResponse.json({
      success: true,
      quotas: updated,
    });
  } catch (err: any) {
    console.error("Admin update quotas error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update system quotas" },
      { status: err.name === "AdminForbiddenError" ? 403 : 500 }
    );
  }
}
