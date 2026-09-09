import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getRoundLearningSummary } from "@/services/qa/qaInterviewLearningService";

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

    const summary = await getRoundLearningSummary(applicationId, user.id, supabase);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (err: any) {
    console.error("[API /api/qa/interview/[applicationId]/round-learning GET Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to load round learning" }, { status: 500 });
  }
}
