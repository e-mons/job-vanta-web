import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

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
      const user = data.session.user;
      if (user) {
        try {
          const adminClient = createAdminClient();
          const metadata = user.user_metadata || {};
          const fullName =
            metadata.full_name ||
            metadata.name ||
            `${metadata.given_name || ''} ${metadata.family_name || ''}`.trim() ||
            null;
          const avatarUrl = metadata.avatar_url || metadata.picture || null;
          const userEmail = user.email || metadata.email || null;

          // 1. Sync / populate public.profiles with Google user information
          const { data: existingProfile } = await adminClient
            .from('profiles')
            .select('id, full_name, avatar_url, email')
            .eq('id', user.id)
            .maybeSingle();

          if (!existingProfile) {
            await adminClient.from('profiles').insert({
              id: user.id,
              full_name: fullName,
              avatar_url: avatarUrl,
              email: userEmail,
              created_at: new Date().toISOString(),
            });
          } else {
            const updates: Record<string, any> = {};
            if (!existingProfile.full_name && fullName) updates.full_name = fullName;
            if (!existingProfile.avatar_url && avatarUrl) updates.avatar_url = avatarUrl;
            if (!existingProfile.email && userEmail) updates.email = userEmail;

            if (Object.keys(updates).length > 0) {
              await adminClient.from('profiles').update(updates).eq('id', user.id);
            }
          }

          // 2. Ensure initial subscription record exists for free tier
          const { data: existingSub } = await adminClient
            .from('subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!existingSub) {
            await adminClient.from('subscriptions').insert({
              user_id: user.id,
              status: 'none',
              plan_id: 'free',
              daily_ai_applies_count: 0,
              daily_usage_date: new Date().toISOString().split('T')[0],
            });
          }

          // 3. Ensure initial daily usage record exists
          const today = new Date().toISOString().split('T')[0];
          const { data: existingUsage } = await adminClient
            .from('user_daily_usage')
            .select('id')
            .eq('user_id', user.id)
            .eq('usage_date', today)
            .maybeSingle();

          if (!existingUsage) {
            await adminClient.from('user_daily_usage').insert({
              user_id: user.id,
              usage_date: today,
              ai_applies_count: 0,
              resumes_created_count: 0,
            });
          }
        } catch (syncErr: any) {
          console.warn('[Auth Callback] Profile/Usage sync warning:', syncErr.message);
        }
      }

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
