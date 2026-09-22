import { NextResponse } from "next/server";
import { dodo } from "@/utils/dodo/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { productId, redirectUrl, redirectPath, discountCode } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sanitize redirect path against open-redirect vulnerabilities
    const rawPath = redirectPath || (typeof redirectUrl === 'string' && redirectUrl.startsWith('/') ? redirectUrl : null);
    let safePath = '/dashboard';
    if (
      rawPath && 
      typeof rawPath === 'string' && 
      rawPath.startsWith('/') && 
      !rawPath.startsWith('//') && 
      !rawPath.toLowerCase().includes('javascript:')
    ) {
      safePath = rawPath;
    }

    // Dynamically detect origin from request headers so preview/production domains work out-of-the-box
    const originHeader = req.headers.get('origin') || req.headers.get('referer');
    let dynamicOrigin = '';
    if (originHeader) {
      try {
        const parsed = new URL(originHeader);
        dynamicOrigin = parsed.origin;
      } catch {}
    }
    const hostHeader = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const protoHeader = req.headers.get('x-forwarded-proto') || 'https';
    const hostOrigin = hostHeader ? `${protoHeader}://${hostHeader}` : '';

    const siteUrl = dynamicOrigin || hostOrigin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    let return_url = `${siteUrl}/payment-callback?redirect=${encodeURIComponent(safePath)}`;

    // If mobile deep-link redirect requested
    if (
      redirectUrl && 
      (redirectUrl.startsWith('jobvanta://') || 
       redirectUrl.startsWith('exp://') || 
       redirectUrl.includes('payment/callback') || 
       redirectUrl.includes('subscription'))
    ) {
      return_url = `${siteUrl}/payment-callback?redirect_to_mobile=${encodeURIComponent(redirectUrl)}`;
    }

    // Create Dodo Payments Checkout Session
    const sessionPayload: any = {
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
        return_path: safePath,
        ...(redirectUrl ? { mobileRedirectUrl: redirectUrl } : {}),
        ...(discountCode ? { promoCode: discountCode } : {}),
      },
    };

    if (discountCode && typeof discountCode === "string" && discountCode.trim()) {
      sessionPayload.discount_code = discountCode.trim();
    }

    const session = await dodo.checkoutSessions.create(sessionPayload);

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
