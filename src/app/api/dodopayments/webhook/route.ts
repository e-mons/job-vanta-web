import { NextResponse } from "next/server";
import { dodo } from "@/utils/dodo/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.text();
  
  const signature = req.headers.get('webhook-signature') || '';
  const timestamp = req.headers.get('webhook-timestamp') || '';
  const id = req.headers.get('webhook-id') || '';

  let event: any;

  try {
    event = dodo.webhooks.unwrap(body, {
      headers: {
        'webhook-id': id,
        'webhook-signature': signature,
        'webhook-timestamp': timestamp,
      },
    });
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "payment.succeeded": {
        // Dodo Payments exposes payment success logic
        // We can extract metadata assuming it was passed in checkout session
        const metadata = event.data.metadata;
        const userId = metadata?.userId;
        const customerId = event.data.customer_id;
        const subscriptionId = event.data.subscription_id;

        if (!userId) break;

        // Note: Dodo uses slightly different objects, assuming standard subscription event shape
        const planId = event.data.product_id;
        
        // Handle subscription upsert
        if (subscriptionId) {
          const { error } = await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              dodo_customer_id: customerId,
              dodo_subscription_id: subscriptionId,
              plan_id: planId,
              status: "active", // Dodo doesn't have multiple complicated statuses initially
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // fallback
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

          if (error) throw error;
        }
        break;
      }

      case "subscription.active":
      case "subscription.renewed":
      case "subscription.canceled": {
        const subscription = event.data;
        
        // Find user by dodo_customer_id
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("dodo_customer_id", subscription.customer_id)
          .single();

        if (subData) {
          await supabase
            .from("subscriptions")
            .update({
              status: subscription.status, // active, canceled, etc
              plan_id: subscription.product_id,
              current_period_end: subscription.next_billing_date || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", subData.user_id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`Webhook handler failed: ${err.message}`);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
