import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // Check if there is an auth error from the OAuth provider
  const authError = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  if (authError) {
    console.error(`[Auth Callback] OAuth provider error: ${authError} - ${errorDesc}`);
    return NextResponse.redirect(
      `${origin}/login?message=${encodeURIComponent(errorDesc || authError)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session) {
      const destination = next.startsWith('/') ? next : `/${next}`;
      console.log(`[Auth Callback] Success exchanging code for session, redirecting to: ${destination}`);
      return NextResponse.redirect(`${origin}${destination}`);
    } else {
      console.error('[Auth Callback] Code exchange error:', error);
      return NextResponse.redirect(
        `${origin}/login?message=${encodeURIComponent(error?.message || 'Authentication failed')}`
      );
    }
  }

  // Fallback for missing authorization code
  return NextResponse.redirect(
    `${origin}/login?message=${encodeURIComponent('No authorization code provided')}`
  );
}
