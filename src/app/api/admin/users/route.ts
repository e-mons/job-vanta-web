import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { AdminFinancialService } from "@/services/admin/adminFinancialService";

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;

    const users = await AdminFinancialService.listCandidateUsers({
      search,
      limit,
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (err: any) {
    console.error("Admin list users error:", err);
    const status = err.name === "AdminForbiddenError" ? 403 : err.name === "AdminUnauthorizedError" ? 401 : 500;
    return NextResponse.json(
      { error: err.message || "Failed to list candidate users" },
      { status }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminContext = await requireAdminPermission();
    const body = await req.json();
    const { action, userId, planId, durationDays, reason } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (action === "reset_limits") {
      await AdminFinancialService.resetUserDailyUsage(userId, adminContext.userId);
      return NextResponse.json({
        success: true,
        message: "User daily AI applies and resume limits reset successfully.",
      });
    }

    if (action === "gift_plan") {
      if (!planId) {
        return NextResponse.json({ error: "Plan ID is required for gifting plan" }, { status: 400 });
      }

      await AdminFinancialService.overrideUserSubscription({
        userId,
        planId,
        status: "active",
        durationDays: durationDays || 30,
        reason: reason || "Admin gift plan",
        adminUserId: adminContext.userId,
      });

      return NextResponse.json({
        success: true,
        message: `Plan ${planId.toUpperCase()} successfully granted for ${durationDays || 30} days.`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin user action error:", err);
    const status = err.name === "AdminForbiddenError" ? 403 : err.name === "AdminUnauthorizedError" ? 401 : 500;
    return NextResponse.json(
      { error: err.message || "Failed to perform user action" },
      { status }
    );
  }
}
