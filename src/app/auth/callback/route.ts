import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const redirectToMobile = searchParams.get('redirect_to_mobile')

  // Check if there is an error from Supabase (e.g. expired link)
  const authError = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  // 1. Mobile-initiated flow
  if (redirectToMobile) {
    // If there is an error from Supabase, pass it along so the mobile-redirect page can show it
    const redirectUrl = new URL(`${origin}/auth/mobile-redirect`)
    redirectUrl.search = searchParams.toString()
    
    console.log(`[Auth Callback] Routing mobile request to client redirect page: ${redirectUrl.toString()}`)
    return NextResponse.redirect(redirectUrl)
  }

  // 2. Web-initiated flow
  if (authError) {
    console.error(`[Auth Callback] Supabase redirect error: ${authError} - ${errorDesc}`)
    return NextResponse.redirect(
      `${origin}/auth/status?status=error&error_description=${encodeURIComponent(errorDesc || authError)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.session) {
      const type = next.includes('reset-password') ? 'reset' : 'signup'
      console.log(`[Auth Callback] Success exchanging code for web session, next is: ${next}`)
      return NextResponse.redirect(
        `${origin}/auth/status?status=success&type=${type}&next=${encodeURIComponent(next)}`
      )
    } else {
      console.error('[Auth Callback] Code exchange error:', error)
      return NextResponse.redirect(
        `${origin}/auth/status?status=error&error_description=${encodeURIComponent(error?.message || 'Verification failed')}`
      )
    }
  }

  // Fallback for no code
  return NextResponse.redirect(
    `${origin}/auth/status?status=error&error_description=${encodeURIComponent('No authorization code provided')}`
  )
}

