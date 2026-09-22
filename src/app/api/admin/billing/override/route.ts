import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { AdminFinancialService } from "@/services/admin/adminFinancialService";

export async function POST(req: NextRequest) {
  try {
    const adminContext = await requireAdminPermission();

    const body = await req.json();
    const { userId, planId, status, durationDays, reason } = body;

    if (!userId || !planId) {
      return NextResponse.json(
        { error: "User ID and plan ID are required." },
        { status: 400 }
      );
    }

    await AdminFinancialService.overrideUserSubscription({
      userId,
      planId: planId as "free" | "pro" | "unlimited",
      status: (status as any) || "active",
      durationDays: durationDays ? Number(durationDays) : 30,
      reason: reason || "Admin manual plan grant",
      adminUserId: adminContext.userId,
    });

    return NextResponse.json({
      success: true,
      message: `Subscription successfully updated for user to ${planId.toUpperCase()}.`,
    });
  } catch (err: any) {
    console.error("Admin subscription override error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to override subscription" },
      { status: err.name === "AdminForbiddenError" ? 403 : 500 }
    );
  }
}
