import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { StaffManagementService } from "@/services/support/staffManagementService";

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission();
    const staff = await StaffManagementService.listStaff();
    return NextResponse.json({ success: true, staff });
  } catch (err: any) {
    console.error("Staff list error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to list staff" },
      { status: err.name === "AdminForbiddenError" ? 403 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminContext = await requireAdminPermission();
    if (adminContext.role !== "super_admin" && adminContext.role !== "support_manager") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin or Support Manager role required to invite staff" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, displayName, role, temporaryPassword } = body;

    if (!email || !displayName || !role) {
      return NextResponse.json(
        { error: "Email, display name, and role are required" },
        { status: 400 }
      );
    }

    const result = await StaffManagementService.inviteStaffMember({
      email,
      displayName,
      role,
      temporaryPassword,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error("Staff invite error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to invite staff member" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminContext = await requireAdminPermission();
    if (adminContext.role !== "super_admin" && adminContext.role !== "support_manager") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin or Support Manager role required to update staff" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { staffId, isActive, role, displayName } = body;

    if (!staffId) {
      return NextResponse.json({ error: "staffId is required" }, { status: 400 });
    }

    await StaffManagementService.updateStaffMember({
      staffId,
      isActive,
      role,
      displayName,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Staff update error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update staff member" },
      { status: 500 }
    );
  }
}
