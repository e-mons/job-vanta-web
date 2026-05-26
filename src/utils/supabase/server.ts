import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export async function createClient() {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | undefined;
  try {
    cookieStore = await cookies();
  } catch (e) {
    // Ignore error if cookies() is called outside request context (e.g. static rendering)
  }

  let authHeader = "";
  try {
    const headerStore = await headers();
    authHeader = headerStore.get("authorization") || "";
  } catch (e) {
    // Ignore error if headers() is called outside request context (e.g. static rendering)
  }

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore ? cookieStore.getAll() : [];
        },
        setAll(cookiesToSet) {
          if (!cookieStore) return;
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      global: {
        headers: authHeader ? { Authorization: authHeader } : undefined,
      },
    }
  );

  // Wrap getUser to check for access token in Authorization header if present
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      const originalGetUser = client.auth.getUser.bind(client.auth);
      client.auth.getUser = async (jwt?: string) => {
        return originalGetUser(jwt || token);
      };
    }
  }

  return client;
}

