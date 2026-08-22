"use client";

import Link from "next/link";
import { LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useActionState } from "react";

import { loginAction } from "@/app/actions/auth";
import { initialAuthActionState } from "@/lib/auth/action-state";
import type { Messages } from "@/lib/i18n/types";

type LoginFormProps = {
  configured: boolean;
  messages: Messages;
};

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? (
    <p className="mt-1.5 text-xs font-medium text-destructive">{errors[0]}</p>
  ) : null;
}

export function LoginForm({ configured, messages }: LoginFormProps) {
  const [state, action, pending] = useActionState(loginAction, initialAuthActionState);

  return (
    <div className="surface-shadow rounded-[1.5rem] border bg-card p-5 sm:p-7">
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3.5 text-sm leading-6 text-emerald-950 dark:text-emerald-100">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">
            {configured ? "Private household login" : "Secure setup required"}
          </p>
          <p className="mt-0.5 opacity-75">
            {configured
              ? "Sign in with your family username. Your private email stays hidden."
              : "The server-only Supabase key must be configured before login can be enabled."}
          </p>
        </div>
      </div>

      <form action={action} className="space-y-5">
        <div>
          <label htmlFor="username" className="mb-2 block text-sm font-medium">
            {messages.auth.username}
          </label>
          <div className="relative">
            <UserRound
              aria-hidden="true"
              className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              disabled={!configured || pending}
              placeholder={messages.auth.usernamePlaceholder}
              aria-invalid={Boolean(state.fieldErrors?.username)}
              className="h-12 w-full rounded-xl border bg-background ps-10 pe-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          <FieldError errors={state.fieldErrors?.username} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="password" className="text-sm font-medium">
              {messages.auth.password}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
            >
              {messages.auth.forgotPassword}
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole
              aria-hidden="true"
              className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={!configured || pending}
              placeholder={messages.auth.passwordPlaceholder}
              aria-invalid={Boolean(state.fieldErrors?.password)}
              className="h-12 w-full rounded-xl border bg-background ps-10 pe-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          <FieldError errors={state.fieldErrors?.password} />
        </div>

        <label className="flex w-fit items-center gap-2.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            disabled={!configured || pending}
            className="size-4 rounded border-input accent-[hsl(var(--primary))]"
          />
          {messages.auth.remember}
        </label>

        {state.message ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/[0.06] px-3.5 py-3 text-sm text-destructive"
          >
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!configured || pending}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {pending ? "Checking securely…" : messages.auth.signIn}
        </button>
      </form>
    </div>
  );
}
