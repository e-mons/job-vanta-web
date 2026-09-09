import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { recordInterviewCheckin } from "@/services/qa/qaInterviewLearningService";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { applicationId, stageId, feeling, notes } = body;

    if (!applicationId || !feeling) {
      return NextResponse.json(
        { error: "applicationId and feeling ('good' | 'okay' | 'difficult') are required" },
        { status: 400 }
      );
    }

    const checkin = await recordInterviewCheckin({
      applicationId,
      stageId: stageId || null,
      userId: user.id,
      feeling,
      notes: notes?.trim() || null,
      clientSupabase: supabase,
    });

    return NextResponse.json({
      success: true,
      data: checkin,
    });
  } catch (err: any) {
    console.error("[API /api/qa/interview/checkin POST Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to record checkin" }, { status: 500 });
  }
}
