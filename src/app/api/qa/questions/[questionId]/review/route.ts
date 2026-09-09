import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { toggleQuestionReview } from "@/services/qa/qaJourneyService";
import { QAAuthorizationError, QANotFoundError } from "@/services/qa/qaContextBuilder";

export async function POST(
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

    const body = await req.json().catch(() => ({}));
    const isReviewed = body.isReviewed !== undefined ? Boolean(body.isReviewed) : true;

    const updatedQuestion = await toggleQuestionReview(
      questionId,
      isReviewed,
      user.id,
      supabase
    );

    return NextResponse.json({
      success: true,
      data: updatedQuestion,
    });
  } catch (err: any) {
    console.error("[API /api/qa/questions/[questionId]/review Error]:", err);

    if (err instanceof QAAuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof QANotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: err.message || "Failed to update question review state" },
      { status: 500 }
    );
  }
}
