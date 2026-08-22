import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { readCurrentProfile } from "@/lib/auth/profile";
import { readAuthState } from "@/lib/auth/session";
import { hasSupabaseEnvironment } from "@/lib/env/public";
import { hasServerEnvironment } from "@/lib/env/server";
import { getMessages } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: getMessages().auth.signIn,
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const authState = await readAuthState();

  if (authState.status === "authenticated") {
    const profile = await readCurrentProfile();
    redirect(profile?.mustChangePassword ? "/change-password" : "/dashboard");
  }

  return (
    <LoginForm
      configured={hasSupabaseEnvironment() && hasServerEnvironment()}
      messages={getMessages()}
    />
  );
}
