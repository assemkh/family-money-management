import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

import { getPublicEnvironment } from "@/lib/env/public";
import { sessionCookieOptions } from "@/lib/auth/cookies";
import { getSupabaseFetch } from "@/lib/observability/supabase-fetch";

type ServerClientOptions = {
  rememberSession?: boolean;
};

export async function createClient(options: ServerClientOptions = {}) {
  const cookieStore = await cookies();
  const environment = getPublicEnvironment();

  return createServerClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      global: { fetch: getSupabaseFetch() },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options: cookieOptions }) =>
              cookieStore.set(
                name,
                value,
                sessionCookieOptions(cookieOptions, options.rememberSession ?? true),
              ),
            );
          } catch {
            // Server Components cannot write cookies. The request proxy owns
            // session refreshes and writes updated cookies to the response.
          }
        },
      },
    },
  );
}

/**
 * The request's default Supabase client. Memoized with React `cache()` so one render
 * or one Server Action builds a single client instead of one per call site. Callers
 * that need non-default cookie behavior, such as the login action's remember-me
 * choice, keep constructing their own with `createClient(options)`.
 */
export const getRequestClient = cache(() => createClient());
