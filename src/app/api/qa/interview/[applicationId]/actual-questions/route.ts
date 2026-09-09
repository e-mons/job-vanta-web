import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: questions, error } = await supabase
      .from("qa_actual_interview_questions")
      .select("*")
      .eq("application_id", applicationId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load actual questions: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: questions || [],
    });
  } catch (err: any) {
    console.error("[API /api/qa/interview/[applicationId]/actual-questions GET Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to load actual questions" }, { status: 500 });
  }
}
