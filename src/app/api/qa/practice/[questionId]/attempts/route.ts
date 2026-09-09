import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { QAAuthorizationError, QANotFoundError } from "@/services/qa/qaContextBuilder";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!questionId) {
      return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
    }

    const { data: attempts, error } = await supabase
      .from("qa_practice_attempts")
      .select("*")
      .eq("question_id", questionId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load attempts: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: attempts || [],
    });
  } catch (err: any) {
    console.error("[API /api/qa/practice/[questionId]/attempts Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load practice attempts" },
      { status: 500 }
    );
  }
}
