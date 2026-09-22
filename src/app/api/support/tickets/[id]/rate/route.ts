import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { SupportTicketService } from "@/services/support/supportTicketService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rating, feedbackNote } = body;

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    await SupportTicketService.rateTicket({
      ticketId: id,
      userId: user.id,
      rating,
      feedbackNote,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Support rating error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit rating" },
      { status: 500 }
    );
  }
}
