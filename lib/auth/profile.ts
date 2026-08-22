import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  familyId: string;
  displayName: string;
  username: string;
  role: "owner" | "member";
  mustChangePassword: boolean;
};

export const readCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, family_id, display_name, username, role, must_change_password")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    familyId: data.family_id,
    displayName: data.display_name,
    username: data.username,
    role: data.role,
    mustChangePassword: data.must_change_password,
  };
});
