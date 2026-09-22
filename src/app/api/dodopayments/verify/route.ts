import { NextResponse } from "next/server";
import { dodo } from "@/utils/dodo/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PLANS } from "@/config/plans";

export const dynamic = 'force-dynamic';

async function syncPaymentForUser(
  userId: string,
  paymentId?: string | null,
  subscriptionId?: string | null
) {
  const adminSupabase = createAdminClient();
  let foundPayment: any = null;
  let foundSubscription: any = null;

  // 1. Direct payment lookup if paymentId is available
  if (paymentId) {
    try {
      const payment = await dodo.payments.retrieve(paymentId);
      if (
        payment &&
        (payment.status === "succeeded" || payment.status === "processing") &&
        (!payment.metadata?.userId || (payment.metadata as any).userId === userId)
      ) {
        foundPayment = payment;
      }
    } catch (e: any) {
      console.warn(`[Verify] Could not retrieve payment by ID ${paymentId}:`, e.message);
    }
  }

  // 2. Direct subscription lookup if subscriptionId is available
  if (!foundPayment && subscriptionId) {
    try {
      const sub = await dodo.subscriptions.retrieve(subscriptionId);
      if (
        sub &&
        (sub.status === "active" || (sub.status as any) === "on_hold" || (sub.status as any) === "trialing") &&
        (!sub.metadata?.userId || (sub.metadata as any).userId === userId)
      ) {
        foundSubscription = sub;
      }
    } catch (e: any) {
      console.warn(`[Verify] Could not retrieve subscription by ID ${subscriptionId}:`, e.message);
    }
  }

  // 3. If not found directly, scan recent payments by user metadata
  if (!foundPayment && !foundSubscription) {
    try {
      const payments = dodo.payments.list({ page_size: 20 });
      for await (const payment of payments) {
        if (
          payment.metadata &&
          (payment.metadata as any).userId === userId &&
          (payment.status === "succeeded" || payment.status === "processing")
        ) {
          foundPayment = payment;
          break;
        }
      }
    } catch (listErr: any) {
      console.warn(`[Verify] Error scanning recent payments:`, listErr.message);
    }
  }

  // 4. If still not found, scan recent subscriptions by user metadata
  if (!foundPayment && !foundSubscription) {
    try {
      const subs = dodo.subscriptions.list({ page_size: 20 });
      for await (const sub of subs) {
        if (
          sub.metadata &&
          (sub.metadata as any).userId === userId &&
          (sub.status === "active" || (sub.status as any) === "trialing")
        ) {
          foundSubscription = sub;
          break;
        }
      }
    } catch (listErr: any) {
      console.warn(`[Verify] Error scanning recent subscriptions:`, listErr.message);
    }
  }

  if (!foundPayment && !foundSubscription) {
    return { success: false, reason: "no_payment_found" };
  }

  // Determine the plan from the product_id
  const rawProductId = foundPayment
    ? (foundPayment.product_id || (foundPayment.product_cart && foundPayment.product_cart[0]?.product_id))
    : (foundSubscription?.product_id);
  
  let resolvedPlanId = "pro";
  if (rawProductId === "pdt_0NewgKeXYMkBEofXpxy9Z" || rawProductId === "unlimited" || rawProductId === "enterprise") {
    resolvedPlanId = "unlimited";
  } else if (rawProductId === "pdt_0Newfu26VwAPCKJBoT8z5" || rawProductId === "pro") {
    resolvedPlanId = "pro";
  } else {
    const matchedPlan = PLANS.find(p => p.priceId === rawProductId || p.id === rawProductId);
    resolvedPlanId = (matchedPlan?.id as string) || rawProductId || "pro";
  }

  const todayDate = new Date().toISOString().split("T")[0];
  const customerId = foundPayment
    ? (foundPayment.customer?.customer_id || (foundPayment as any).customer_id)
    : (foundSubscription?.customer?.customer_id || (foundSubscription as any).customer_id);
  const resolvedSubId = foundPayment?.subscription_id || foundSubscription?.subscription_id || null;
  const resolvedPayId = foundPayment?.payment_id || null;
  const nextBilling = foundSubscription?.next_billing_date 
    || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Upsert the subscription into Supabase
  const { error } = await adminSupabase
    .from("subscriptions")
    .upsert({
      user_id: userId,
      dodo_customer_id: customerId || null,
      dodo_subscription_id: resolvedSubId,
      dodo_payment_id: resolvedPayId,
      last_payment_details: foundPayment || foundSubscription,
      plan_id: resolvedPlanId,
      status: "active",
      daily_ai_applies_count: 0,
      daily_usage_date: todayDate,
      current_period_end: nextBilling,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) {
    console.error("[Verify] Supabase upsert error:", error);
    throw error;
  }

  console.log(`[Verify] Subscription synced for user ${userId}, plan: ${resolvedPlanId}`);
  return { 
    success: true, 
    planId: resolvedPlanId, 
    payment: foundPayment || foundSubscription 
  };
}

/**
 * GET /api/dodopayments/verify
 * Optional direct redirect return handler from Dodo checkout
 */
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const paymentId = searchParams.get('payment_id');
  const subscriptionId = searchParams.get('subscription_id');
  const rawRedirect = searchParams.get('redirect') || '/dashboard';
  const isMobile = searchParams.get('mobile') === 'true';

  let safeRedirect = '/dashboard';
  if (
    rawRedirect &&
    rawRedirect.startsWith('/') &&
    !rawRedirect.startsWith('//') &&
    !rawRedirect.toLowerCase().includes('javascript:')
  ) {
    safeRedirect = rawRedirect;
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await syncPaymentForUser(user.id, paymentId, subscriptionId);
    }
  } catch (err: any) {
    console.warn('[Verify GET] Warning syncing payment:', err.message);
  }

  if (isMobile) {
    return NextResponse.redirect(
      `jobvanta://payment/callback?status=success&returnPath=${encodeURIComponent(safeRedirect)}`
    );
  }

  const separator = safeRedirect.includes('?') ? '&' : '?';
  return NextResponse.redirect(`${origin}${safeRedirect}${separator}payment=success`);
}

/**
 * POST /api/dodopayments/verify
 * Called by client after user returns from Dodo checkout
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const paymentId = body.paymentId || body.payment_id || null;
    const subscriptionId = body.subscriptionId || body.subscription_id || null;

    const result = await syncPaymentForUser(user.id, paymentId, subscriptionId);

    if (!result.success) {
      // Fallback: check if user already has an active subscription in our DB
      const adminSupabase = createAdminClient();
      const { data: existingSub } = await adminSupabase
        .from("subscriptions")
        .select("status, plan_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingSub && existingSub.status === "active") {
        return NextResponse.json({ 
          status: "already_active",
          planId: existingSub.plan_id 
        });
      }

      console.log(`[Verify] No successful payment or subscription found for user ${user.id}`);
      return NextResponse.json({ status: "no_payment_found" });
    }

    return NextResponse.json({ 
      status: "synced",
      planId: result.planId,
    });

  } catch (err: any) {
    console.error("[Verify] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
