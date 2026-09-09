import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guard against redirecting Next.js Server Actions, non-GET requests, and API routes.
  // Next.js Server Actions expect RSC streaming response headers; returning an HTTP redirect
  // response causes Next.js client runtime to throw:
  // "Error: An unexpected response was received from the server."
  const isServerAction = request.headers.has("next-action") || request.method !== "GET";
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");

  if (!isServerAction && !isApiRoute) {
    const protectedRoutes = [
      "/dashboard",
      "/builder",
      "/jobs",
      "/applications",
      "/resumes",
      "/cover-letter",
      "/billing",
    ];
    // Note: /forgot-password and /reset-password MUST NOT be in authRoutes because users recovering
    // their password temporarily establish a recovery session and must not be bounced to /dashboard!
    const authRoutes = ["/login", "/signup"];

    const isProtectedRoute = protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );
    const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname === route);

    if (!user && isProtectedRoute) {
      const url = request.nextUrl.clone();
      const next = url.pathname + url.search;
      url.pathname = "/login";
      url.searchParams.set("next", next);
      return NextResponse.redirect(url);
    }

    if (user && isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
