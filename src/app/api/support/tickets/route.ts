import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { SupportTicketService } from "@/services/support/supportTicketService";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await SupportTicketService.getUserTickets(user.id);

    return NextResponse.json({ success: true, tickets });
  } catch (err: any) {
    console.error("Fetch candidate tickets error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch support tickets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, category, priority, source, contextSnapshot, initialMessage } = body;

    const result = await SupportTicketService.createTicket({
      userId: user.id,
      subject: subject || "Live Human Support Request",
      category: category || "general",
      priority: priority || "normal",
      source: source || "ai_assistant_handoff",
      contextSnapshot: contextSnapshot || {},
      initialMessage,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error("Support ticket creation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create support ticket" },
      { status: 500 }
    );
  }
}
