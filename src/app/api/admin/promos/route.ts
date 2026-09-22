import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { AdminFinancialService } from "@/services/admin/adminFinancialService";

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission();

    const promos = await AdminFinancialService.listPromoCodes();

    return NextResponse.json({
      success: true,
      promos,
    });
  } catch (err: any) {
    console.error("Admin list promos error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to list promo codes" },
      { status: err.name === "AdminForbiddenError" ? 403 : 401 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminContext = await requireAdminPermission();
    const body = await req.json();

    const { code, discountType, discountValue, planId, maxRedemptions, expiresAt } = body;

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { error: "Code, discount type, and discount value are required" },
        { status: 400 }
      );
    }

    const created = await AdminFinancialService.createPromoCode({
      code,
      discountType,
      discountValue: Number(discountValue),
      planId: planId || "all",
      maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
      expiresAt: expiresAt || null,
      adminUserId: adminContext.userId,
    });

    return NextResponse.json({
      success: true,
      promo: created,
    });
  } catch (err: any) {
    console.error("Admin create promo error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create promo code" },
      { status: err.name === "AdminForbiddenError" ? 403 : 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdminPermission();
    const body = await req.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "ID and isActive status are required" },
        { status: 400 }
      );
    }

    await AdminFinancialService.togglePromoCode(id, isActive);

    return NextResponse.json({
      success: true,
      message: `Promo code ${isActive ? "activated" : "deactivated"} successfully.`,
    });
  } catch (err: any) {
    console.error("Admin toggle promo error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to toggle promo code" },
      { status: err.name === "AdminForbiddenError" ? 403 : 500 }
    );
  }
}
