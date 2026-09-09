import { NextResponse } from "next/server";
import { dodo } from "@/utils/dodo/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PLANS } from "@/config/plans";

export const dynamic = 'force-dynamic';

/**
 * POST /api/dodopayments/verify
 * 
 * Called after the user returns from Dodo checkout.
 * Lists recent payments for the current user's email and syncs
 * the subscription to Supabase if a successful payment is found.
 * 
 * This is a fallback mechanism for when webhooks can't reach 
 * the server (e.g., localhost development).
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has an active subscription in our DB
    const adminSupabase = createAdminClient();
    const { data: existingSub } = await adminSupabase
      .from("subscriptions")
      .select("status, plan_id")
      .eq("user_id", user.id)
      .single();

    if (existingSub && existingSub.status === "active") {
      return NextResponse.json({ 
        status: "already_active",
        planId: existingSub.plan_id 
      });
    }

    // List recent payments from Dodo to find one belonging to this user
    let foundPayment: any = null;

    const payments = dodo.payments.list({ page_size: 20 });
    for await (const payment of payments) {
      // Check if this payment belongs to the current user via metadata
      if (
        payment.metadata &&
        (payment.metadata as any).userId === user.id &&
        payment.status === "succeeded"
      ) {
        foundPayment = payment;
        break;
      }
    }

    if (!foundPayment) {
      console.log(`[Verify] No successful payment found for user ${user.id}`);
      return NextResponse.json({ status: "no_payment_found" });
    }

    console.log(`[Verify] Found payment for user ${user.id}:`, {
      payment_id: foundPayment.payment_id,
      product_id: foundPayment.product_id,
      status: foundPayment.status,
    });

    // Determine the plan from the product_id
    const productId = foundPayment.product_id || 
      (foundPayment.product_cart && foundPayment.product_cart[0]?.product_id);
    
    let resolvedPlanId = "pro";
    if (productId === "pdt_0NewgKeXYMkBEofXpxy9Z" || productId === "unlimited" || productId === "enterprise") {
      resolvedPlanId = "unlimited";
    } else if (productId === "pdt_0Newfu26VwAPCKJBoT8z5" || productId === "pro") {
      resolvedPlanId = "pro";
    } else {
      const matchedPlan = PLANS.find(p => p.priceId === productId || p.id === productId);
      resolvedPlanId = (matchedPlan?.id as string) || productId || "pro";
    }

    const todayDate = new Date().toISOString().split("T")[0];

    // Upsert the subscription into Supabase
    const { error } = await adminSupabase
      .from("subscriptions")
      .upsert({
        user_id: user.id,
        dodo_customer_id: foundPayment.customer?.customer_id || foundPayment.customer_id || null,
        dodo_subscription_id: foundPayment.subscription_id || null,
        dodo_payment_id: foundPayment.payment_id || null,
        last_payment_details: foundPayment,
        plan_id: resolvedPlanId,
        status: "active",
        daily_ai_applies_count: 0,
        daily_usage_date: todayDate,
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) {
      console.error("[Verify] Supabase upsert error:", error);
      throw error;
    }

    console.log(`[Verify] Subscription synced for user ${user.id}, plan: ${resolvedPlanId}`);

    return NextResponse.json({ 
      status: "synced",
      planId: resolvedPlanId,
    });

  } catch (err: any) {
    console.error("[Verify] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
