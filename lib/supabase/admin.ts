import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getPublicEnvironment } from "@/lib/env/public";
import { getServerEnvironment } from "@/lib/env/server";
import { getSupabaseFetch } from "@/lib/observability/supabase-fetch";

export function createAdminClient() {
  const publicEnvironment = getPublicEnvironment();
  const serverEnvironment = getServerEnvironment();

  return createSupabaseClient(
    publicEnvironment.NEXT_PUBLIC_SUPABASE_URL,
    serverEnvironment.SUPABASE_SECRET_KEY,
    {
      global: { fetch: getSupabaseFetch() },
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}
