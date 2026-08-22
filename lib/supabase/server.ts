import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicEnvironment } from "@/lib/env/public";
import { sessionCookieOptions } from "@/lib/auth/cookies";

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
