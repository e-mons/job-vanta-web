import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { AdminFinancialService } from "@/services/admin/adminFinancialService";

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || undefined;

    const subscriptions = await AdminFinancialService.listSubscriptions({
      status,
      search,
    });

    return NextResponse.json({
      success: true,
      subscriptions,
    });
  } catch (err: any) {
    console.error("Admin subscriptions error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to list subscriptions" },
      { status: err.name === "AdminForbiddenError" ? 403 : 401 }
    );
  }
}
