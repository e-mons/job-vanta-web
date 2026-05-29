import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'
  const redirectToMobile = searchParams.get('redirect_to_mobile')

  if (redirectToMobile) {
    const newUrl = new URL(request.url)
    newUrl.searchParams.delete('redirect_to_mobile')
    const searchString = newUrl.searchParams.toString()
    const separator = redirectToMobile.includes('?') ? '&' : '?'
    const mobileLink = `${redirectToMobile}${searchString ? separator + searchString : ''}`
    
    console.log(`[Auth Callback] Redirecting to mobile deep link: ${mobileLink}`)
    return NextResponse.redirect(mobileLink)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.session) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
