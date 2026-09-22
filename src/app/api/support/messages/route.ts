import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { SupportTicketService } from "@/services/support/supportTicketService";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ticketId, content, isInternalNote, attachments } = body;

    if (!ticketId || !content?.trim()) {
      return NextResponse.json(
        { error: "Ticket ID and message content are required" },
        { status: 400 }
      );
    }

    // Check if current user is an admin/staff or the ticket owner
    const adminClient = createAdminClient();
    const { data: adminRecord } = await adminClient
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const isStaff = Boolean(adminRecord);

    // Verify ticket ownership if not staff
    if (!isStaff) {
      const { data: ticket } = await adminClient
        .from("support_tickets")
        .select("user_id")
        .eq("id", ticketId)
        .single();

      if (!ticket || ticket.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden: Not your ticket" }, { status: 403 });
      }

      if (isInternalNote) {
        return NextResponse.json({ error: "Only staff can post internal notes" }, { status: 403 });
      }
    }

    const message = await SupportTicketService.postMessage({
      ticketId,
      senderId: user.id,
      senderType: isStaff ? "agent" : "user",
      content: content.trim(),
      isInternalNote: isStaff ? Boolean(isInternalNote) : false,
      attachments,
    });

    return NextResponse.json({ success: true, message });
  } catch (err: any) {
    console.error("Support message error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
