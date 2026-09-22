import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { SupportTicketService } from "@/services/support/supportTicketService";

export async function GET(
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

    const { ticket, messages } = await SupportTicketService.getUserTicketDetail(user.id, id);

    return NextResponse.json({ success: true, ticket, messages });
  } catch (err: any) {
    console.error("Fetch candidate ticket detail error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch ticket detail" },
      { status: err.message?.includes("not found") ? 404 : 500 }
    );
  }
}
