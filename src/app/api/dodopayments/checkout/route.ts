import { NextResponse } from "next/server";
import { dodo } from "@/utils/dodo/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { productId, redirectUrl } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const return_url = redirectUrl 
      ? `${siteUrl}/payment-callback?redirect_to_mobile=${encodeURIComponent(redirectUrl)}`
      : `${siteUrl}/dashboard`;

    // Create Dodo Payments Checkout Session
    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      ...(user.email ? {
        customer: {
          email: user.email,
        }
      } : {}),
      return_url,
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({ url: session.checkout_url });
  } catch (err: any) {
    console.error("Dodo checkout error:", {
      status: err.status,
      error: err.error,
      message: err.message
    });
    return NextResponse.json({ 
      error: err.error?.error || err.message || 'Internal Server Error',
      details: err.error
    }, { status: err.status || 500 });
  }
}
