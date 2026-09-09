import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { transitionStage } from "@/services/qa/qaJourneyService";
import { QAAuthorizationError, QANotFoundError } from "@/services/qa/qaContextBuilder";
import type { QAStageType } from "@shared/types/qa";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { applicationId, targetStageType, forceRegenerate } = body;

    if (!applicationId || typeof applicationId !== "string") {
      return NextResponse.json({ error: "Missing or invalid applicationId" }, { status: 400 });
    }

    if (!targetStageType || typeof targetStageType !== "string") {
      return NextResponse.json({ error: "Missing or invalid targetStageType" }, { status: 400 });
    }

    const result = await transitionStage(
      applicationId,
      targetStageType as QAStageType,
      user.id,
      {
        supabaseClient: supabase,
        forceRegenerate: Boolean(forceRegenerate),
      }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[API /api/qa/stage/transition Error]:", err);

    if (err instanceof QAAuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof QANotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: err.message || "Failed to transition stage" },
      { status: 500 }
    );
  }
}
