import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { getQASettings, updateQASettings } from "@/services/admin/qaSettingsService";

export async function GET() {
  try {
    await requireAdminPermission("qa.view_health");
    const settings = await getQASettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (err: any) {
    const status = err.name === "AdminUnauthorizedError" ? 401 : err.name === "AdminForbiddenError" ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission("qa.manage_settings");
    const body = await req.json().catch(() => ({}));
    const { updates, reason } = body;

    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ success: false, error: "Settings updates object required" }, { status: 400 });
    }

    const updated = await updateQASettings(
      updates,
      { adminId: admin.userId, adminEmail: admin.email },
      reason
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    const status = err.name === "AdminUnauthorizedError" ? 401 : err.name === "AdminForbiddenError" ? 403 : 400;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
