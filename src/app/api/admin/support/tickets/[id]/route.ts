import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { SupportTicketService } from "@/services/support/supportTicketService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission();
    const { id } = await params;

    const data = await SupportTicketService.getAdminTicketDetails(id);
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    console.error("Admin ticket detail error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch ticket detail" },
      { status: err.name === "AdminForbiddenError" ? 403 : 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminContext = await requireAdminPermission();
    const { id } = await params;
    const body = await req.json();
    const { assignedAgentId, status, priority, claim } = body;

    let targetAgentId = assignedAgentId;
    if (claim) {
      targetAgentId = adminContext.userId;
    }

    const updated = await SupportTicketService.updateTicket({
      ticketId: id,
      assignedAgentId: targetAgentId,
      status,
      priority,
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (err: any) {
    console.error("Admin ticket update error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update ticket" },
      { status: err.name === "AdminForbiddenError" ? 403 : 500 }
    );
  }
}
