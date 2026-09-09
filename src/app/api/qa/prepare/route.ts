import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { 
  prepareApplicationQA, 
  QAGenerationInProgressError, 
  QAInvalidAIOutputError, 
  QAGenerationFailedError 
} from "@/services/qa/qaEngineService";
import { QAAuthorizationError, QANotFoundError } from "@/services/qa/qaContextBuilder";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { applicationId, stageType, forceRegenerate } = body;

    if (!applicationId || typeof applicationId !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing 'applicationId'" },
        { status: 400 }
      );
    }

    // Check plan access: Free plan cannot use Prepare Me
    const { data: subData } = await supabase
      .from("subscriptions")
      .select("status, plan_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const isActive = subData?.status === "active" || subData?.status === "trialing";
    const isAllowed = isActive && (
      subData?.plan_id === "pdt_0Newfu26VwAPCKJBoT8z5" ||
      subData?.plan_id === "pdt_0NewgKeXYMkBEofXpxy9Z" ||
      subData?.plan_id === "pro" ||
      subData?.plan_id === "unlimited" ||
      subData?.plan_id === "enterprise"
    );

    if (!isAllowed) {
      return NextResponse.json({
        error: "The Prepare Me feature (Job-Specific AI Questions & Answers) is available exclusively on Pro and Unlimited plans. Please upgrade to Pro Plan to continue.",
        code: "PLAN_UPGRADE_REQUIRED",
        requiredTier: "pro"
      }, { status: 403 });
    }

    const result = await prepareApplicationQA(applicationId, user.id, {
      stageType,
      forceRegenerate: Boolean(forceRegenerate),
      customSupabaseClient: supabase,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[API /api/qa/prepare Error]:", err);

    if (err instanceof QAAuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof QANotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof QAGenerationInProgressError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof QAInvalidAIOutputError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    if (err instanceof QAGenerationFailedError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: err.message || "An unexpected error occurred while preparing Q&A" },
      { status: 500 }
    );
  }
}
