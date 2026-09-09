import { NextResponse } from "next/server";
import { dodo } from "@/utils/dodo/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('dodo_customer_id, status, plan_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = subscription?.dodo_customer_id;

    // Fallback: If no customer ID saved yet, attempt lookup by user email
    if (!customerId && user.email) {
      try {
        const customersList = await dodo.customers.list({ email: user.email });
        const matched = customersList.items?.find((c: any) => c.email?.toLowerCase() === user.email?.toLowerCase());
        if (matched?.customer_id) {
          customerId = matched.customer_id;
          await supabase
            .from('subscriptions')
            .update({ dodo_customer_id: customerId })
            .eq('user_id', user.id);
        }
      } catch (lookupErr: any) {
        console.warn("[Portal] Customer lookup warning:", lookupErr.message);
      }
    }

    if (!customerId) {
      return NextResponse.json({ 
        error: "No active billing profile found. Please subscribe to a Pro or Unlimited plan first." 
      }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const portalSession = await dodo.customers.customerPortal.create(customerId, {
      return_url: `${siteUrl}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.link });
  } catch (err: any) {
    console.error("Dodo portal error:", err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
