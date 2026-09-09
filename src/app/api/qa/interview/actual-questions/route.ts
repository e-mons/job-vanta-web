import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { recordActualInterviewQuestion } from "@/services/qa/qaInterviewLearningService";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { applicationId, stageId, questionText, difficultyRating, notes } = body;

    if (!applicationId || !questionText?.trim()) {
      return NextResponse.json(
        { error: "applicationId and questionText are required" },
        { status: 400 }
      );
    }

    const question = await recordActualInterviewQuestion({
      applicationId,
      stageId: stageId || null,
      userId: user.id,
      questionText: questionText.trim(),
      difficultyRating: difficultyRating || "neutral",
      notes: notes?.trim() || null,
      clientSupabase: supabase,
    });

    return NextResponse.json({
      success: true,
      data: question,
    });
  } catch (err: any) {
    console.error("[API /api/qa/interview/actual-questions POST Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to record actual question" }, { status: 500 });
  }
}
