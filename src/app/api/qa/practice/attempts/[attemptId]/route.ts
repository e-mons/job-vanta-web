import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { deletePracticeAttempt } from "@/services/qa/qaPracticeService";
import { QAAuthorizationError, QANotFoundError } from "@/services/qa/qaContextBuilder";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!attemptId) {
      return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });
    }

    await deletePracticeAttempt(attemptId, user.id, supabase);

    return NextResponse.json({
      success: true,
      message: "Practice attempt deleted successfully",
    });
  } catch (err: any) {
    console.error("[API /api/qa/practice/attempts/[attemptId] DELETE Error]:", err);

    if (err instanceof QAAuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof QANotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: err.message || "Failed to delete practice attempt" },
      { status: 500 }
    );
  }
}
