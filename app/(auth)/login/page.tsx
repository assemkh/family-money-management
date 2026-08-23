import type { Metadata } from "next";
import { LockKeyhole, LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/actions/auth";
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
    if (profile) {
      redirect(profile.mustChangePassword ? "/change-password" : "/dashboard");
    }

    return (
      <section className="surface-shadow rounded-[1.5rem] border bg-card p-6 sm:p-8">
        <span className="grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
          <LockKeyhole aria-hidden="true" className="size-5" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-amber-700 dark:text-amber-300">
          Access paused
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em]">
          This family account is inactive.
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Family data is blocked at the database boundary. Ask the household owner to
          restore access, then sign in again.
        </p>
        <form action={logoutAction} className="mt-6">
          <input type="hidden" name="scope" value="local" />
          <button
            type="submit"
            className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <LogOut aria-hidden="true" className="size-4" /> Clear this session
          </button>
        </form>
      </section>
    );
  }

  return (
    <LoginForm
      configured={hasSupabaseEnvironment() && hasServerEnvironment()}
      messages={getMessages()}
    />
  );
}
