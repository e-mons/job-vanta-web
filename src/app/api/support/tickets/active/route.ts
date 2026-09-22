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

    const { ticket, messages } = await SupportTicketService.getActiveUserTicket(user.id);

    return NextResponse.json({
      success: true,
      ticket,
      messages,
    });
  } catch (err: any) {
    console.error("Fetch active support ticket error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch active ticket" },
      { status: 500 }
    );
  }
}
