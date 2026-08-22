import type { JwtPayload } from "@supabase/supabase-js";
import { cache } from "react";

import { hasSupabaseEnvironment } from "@/lib/env/public";
import { createClient } from "@/lib/supabase/server";

export type AuthState =
  | { status: "authenticated"; claims: JwtPayload }
  | { status: "anonymous" }
  | { status: "unconfigured" }
  | { status: "unavailable" };

export const readAuthState = cache(async (): Promise<AuthState> => {
  if (!hasSupabaseEnvironment()) {
    return { status: "unconfigured" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims) {
      return { status: "anonymous" };
    }

    return { status: "authenticated", claims: data.claims };
  } catch {
    return { status: "unavailable" };
  }
});
