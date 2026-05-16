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
      .select('dodo_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!subscription?.dodo_customer_id) {
      return NextResponse.json({ error: "No active subscription found. Please subscribe to a plan first." }, { status: 400 });
    }

    const portalSession = await dodo.customers.customerPortal.create(subscription.dodo_customer_id);

    return NextResponse.json({ url: portalSession.link });
  } catch (err: any) {
    console.error("Dodo portal error:", err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
