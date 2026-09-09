import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { getQAIncidents, createQAIncident, updateQAIncident } from "@/services/admin/qaIncidentService";

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission("qa.view_health");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as any;

    const incidents = await getQAIncidents({ status: status || undefined });
    return NextResponse.json({ success: true, data: incidents });
  } catch (err: any) {
    const status = err.name === "AdminUnauthorizedError" ? 401 : err.name === "AdminForbiddenError" ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission("qa.manage_incidents");
    const body = await req.json().catch(() => ({}));
    const { action, incidentId, updates, reason, ...createData } = body;

    if (action === "update" && incidentId) {
      const updated = await updateQAIncident(
        incidentId,
        updates || {},
        { adminId: admin.userId, adminEmail: admin.email },
        reason
      );
      return NextResponse.json({ success: true, data: updated });
    }

    if (!createData.title || !createData.description || !createData.severity) {
      return NextResponse.json(
        { success: false, error: "Title, description, and severity required" },
        { status: 400 }
      );
    }

    const created = await createQAIncident(
      createData,
      { adminId: admin.userId, adminEmail: admin.email }
    );
    return NextResponse.json({ success: true, data: created });
  } catch (err: any) {
    const status = err.name === "AdminUnauthorizedError" ? 401 : err.name === "AdminForbiddenError" ? 403 : 400;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
