import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { SupportTicketService } from "@/services/support/supportTicketService";
import { StaffManagementService } from "@/services/support/staffManagementService";

export async function GET(req: NextRequest) {
  try {
    // Require admin or support staff access
    const adminContext = await requireAdminPermission();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const agentId = searchParams.get("agentId") || undefined;
    const unassignedOnly = searchParams.get("unassigned") === "true";
    const search = searchParams.get("search") || undefined;

    const [tickets, metrics] = await Promise.all([
      SupportTicketService.listAdminTickets({
        status,
        agentId,
        unassignedOnly,
        search,
      }),
      StaffManagementService.getSupportMetrics(),
    ]);

    return NextResponse.json({
      success: true,
      tickets,
      metrics,
      currentAgentId: adminContext.userId,
    });
  } catch (err: any) {
    console.error("Admin tickets list error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to list tickets" },
      { status: err.name === "AdminForbiddenError" ? 403 : 401 }
    );
  }
}
