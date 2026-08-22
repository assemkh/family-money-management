"use client";

import Link from "next/link";
import { ArrowLeft, Send, UserRound } from "lucide-react";
import { useActionState } from "react";

import { forgotPasswordAction } from "@/app/actions/auth";
import { initialAuthActionState } from "@/lib/auth/action-state";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    forgotPasswordAction,
    initialAuthActionState,
  );

  return (
    <div className="surface-shadow rounded-[1.5rem] border bg-card p-5 sm:p-7">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          Account recovery
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.035em]">
          Reset your password
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Enter only your username. If a recovery address exists, we’ll send the secure
          link there without revealing it.
        </p>
      </div>

      <form action={action} className="space-y-5">
        <div>
          <label htmlFor="username" className="mb-2 block text-sm font-medium">
            Username
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
              required
              disabled={pending}
              className="h-12 w-full rounded-xl border bg-background ps-10 pe-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          {state.fieldErrors?.username?.[0] ? (
            <p className="mt-1.5 text-xs font-medium text-destructive">
              {state.fieldErrors.username[0]}
            </p>
          ) : null}
        </div>

        {state.message ? (
          <p
            role="status"
            className={`rounded-xl border px-3.5 py-3 text-sm ${
              state.status === "success"
                ? "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-900 dark:text-emerald-100"
                : "border-destructive/20 bg-destructive/[0.06] text-destructive"
            }`}
          >
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Send aria-hidden="true" className="size-4" />
          {pending ? "Sending…" : "Send recovery link"}
        </button>
      </form>

      <Link
        href="/login"
        className="mt-5 flex w-fit items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
        Back to sign in
      </Link>
    </div>
  );
}
