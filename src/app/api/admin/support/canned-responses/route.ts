import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/services/admin/adminAuthService";
import { SupportTicketService } from "@/services/support/supportTicketService";

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission();
    const cannedResponses = await SupportTicketService.getCannedResponses();
    return NextResponse.json({ success: true, cannedResponses });
  } catch (err: any) {
    console.error("Canned responses error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch canned responses" },
      { status: 500 }
    );
  }
}
