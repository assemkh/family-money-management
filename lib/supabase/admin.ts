import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getPublicEnvironment } from "@/lib/env/public";
import { getServerEnvironment } from "@/lib/env/server";

export function createAdminClient() {
  const publicEnvironment = getPublicEnvironment();
  const serverEnvironment = getServerEnvironment();

  return createSupabaseClient(
    publicEnvironment.NEXT_PUBLIC_SUPABASE_URL,
    serverEnvironment.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}
