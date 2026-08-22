import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginFoundationForm } from "@/components/auth/login-foundation-form";
import { readAuthState } from "@/lib/auth/session";
import { hasSupabaseEnvironment } from "@/lib/env/public";
import { getMessages } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: getMessages().auth.signIn,
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const authState = await readAuthState();

  if (authState.status === "authenticated") {
    redirect("/dashboard");
  }

  return (
    <LoginFoundationForm
      configured={hasSupabaseEnvironment()}
      messages={getMessages()}
    />
  );
}
