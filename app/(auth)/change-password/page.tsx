import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { readCurrentProfile } from "@/lib/auth/profile";
import { readAuthState } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Change password" };
export const dynamic = "force-dynamic";

type ChangePasswordPageProps = {
  searchParams: Promise<{ recovery?: string }>;
};

export default async function ChangePasswordPage({
  searchParams,
}: ChangePasswordPageProps) {
  const [authState, params] = await Promise.all([readAuthState(), searchParams]);

  if (authState.status !== "authenticated") redirect("/login");

  const profile = await readCurrentProfile();

  if (!profile) redirect("/login");

  return (
    <ChangePasswordForm
      recovery={params.recovery === "1"}
      requiredChange={profile.mustChangePassword}
    />
  );
}
