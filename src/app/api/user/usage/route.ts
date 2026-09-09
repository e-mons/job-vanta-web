import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { PLANS } from "@/config/plans";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch user subscription details
    const { data: subData } = await supabase
      .from("subscriptions")
      .select("status, plan_id, current_period_end, dodo_customer_id, daily_ai_applies_count, daily_usage_date")
      .eq("user_id", user.id)
      .maybeSingle();

    // 2. Count total resumes created by user
    const { count: resumesCount, error: resumeCountError } = await supabase
      .from("resumes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (resumeCountError) {
      console.warn("[Usage API] Error counting resumes:", resumeCountError.message);
    }

    const currentResumes = resumesCount || 0;

    // 3. Determine active plan tier
    const status = subData?.status || "none";
    const planId = subData?.plan_id || null;
    const isActive = status === "active" || status === "trialing";

    let planTier: "free" | "pro" | "unlimited" = "free";
    if (isActive) {
      if (
        planId === "pdt_0NewgKeXYMkBEofXpxy9Z" ||
        planId === "unlimited" ||
        planId === "enterprise"
      ) {
        planTier = "unlimited";
      } else if (
        planId === "pdt_0Newfu26VwAPCKJBoT8z5" ||
        planId === "pro"
      ) {
        planTier = "pro";
      }
    }

    // 4. Calculate today's AI apply count (resetting automatically if date is earlier)
    const today = new Date().toISOString().split("T")[0];
    const subUsageDate = subData?.daily_usage_date ? String(subData.daily_usage_date).split("T")[0] : null;
    const aiAppliesUsedToday = (subUsageDate === today && typeof subData?.daily_ai_applies_count === "number")
      ? subData.daily_ai_applies_count
      : 0;

    // 5. Compute limits and remaining quotas according to strict rules
    if (planTier === "unlimited") {
      return NextResponse.json({
        planTier: "unlimited",
        planName: "Unlimited",
        subscription: {
          status,
          planId,
          currentPeriodEnd: subData?.current_period_end || null,
          dodoCustomerId: subData?.dodo_customer_id || null,
        },
        limits: {
          resumes: "unlimited",
          dailyAIApplies: "unlimited",
          prepareMe: true,
        },
        usage: {
          resumesCreated: currentResumes,
          resumesRemaining: "unlimited",
          aiAppliesUsedToday,
          aiAppliesRemainingToday: "unlimited",
          isUnlimited: true,
        },
      });
    }

    if (planTier === "pro") {
      const resumesLimit = 5;
      const dailyAppliesLimit = 25;
      return NextResponse.json({
        planTier: "pro",
        planName: "Pro",
        subscription: {
          status,
          planId,
          currentPeriodEnd: subData?.current_period_end || null,
          dodoCustomerId: subData?.dodo_customer_id || null,
        },
        limits: {
          resumes: resumesLimit,
          dailyAIApplies: dailyAppliesLimit,
          prepareMe: true,
        },
        usage: {
          resumesCreated: currentResumes,
          resumesRemaining: Math.max(0, resumesLimit - currentResumes),
          aiAppliesUsedToday,
          aiAppliesRemainingToday: Math.max(0, dailyAppliesLimit - aiAppliesUsedToday),
          isUnlimited: false,
        },
      });
    }

    // Free tier defaults
    const resumesLimit = 1;
    const dailyAppliesLimit = 2;
    return NextResponse.json({
      planTier: "free",
      planName: "Free",
      subscription: {
        status: status === "none" ? "free" : status,
        planId: null,
        currentPeriodEnd: null,
        dodoCustomerId: null,
      },
      limits: {
        resumes: resumesLimit,
        dailyAIApplies: dailyAppliesLimit,
        prepareMe: false,
      },
      usage: {
        resumesCreated: currentResumes,
        resumesRemaining: Math.max(0, resumesLimit - currentResumes),
        aiAppliesUsedToday,
        aiAppliesRemainingToday: Math.max(0, dailyAppliesLimit - aiAppliesUsedToday),
        isUnlimited: false,
      },
    });
  } catch (err: any) {
    console.error("[API /api/user/usage] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to retrieve usage details" }, { status: 500 });
  }
}
