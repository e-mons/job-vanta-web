import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { recordStoryUsage } from "@/services/qa/qaStoryBankService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { applicationId, questionId, stageId } = body;

    const usage = await recordStoryUsage({
      storyId,
      userId: user.id,
      applicationId,
      questionId,
      stageId,
      clientSupabase: supabase,
    });

    return NextResponse.json({
      success: true,
      data: usage,
    });
  } catch (err: any) {
    console.error("[API /api/qa/stories/[storyId]/use POST Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to record story usage" }, { status: 500 });
  }
}
