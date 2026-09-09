import { createBrowserClient } from "@supabase/ssr";

async function browserResilientFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const res = await fetch(input, init);
      // If PostgREST returns 401 with PGRST303 (JWT timing/clock-skew validation failure across edge nodes), retry briefly
      const proxyStatus = res.headers.get("proxy-status") || "";
      if (res.status === 401 && proxyStatus.includes("PGRST303") && attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, attempts * 350));
        continue;
      }
      return res;
    } catch (err: any) {
      if (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, attempts * 300));
        continue;
      }
      throw err;
    }
  }
  return fetch(input, init);
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: browserResilientFetch,
      },
    }
  );
}
