import { LockKeyhole, UserRound } from "lucide-react";
import Link from "next/link";

import type { Messages } from "@/lib/i18n/types";

type LoginFoundationFormProps = {
  configured: boolean;
  messages: Messages;
};

export function LoginFoundationForm({
  configured,
  messages,
}: LoginFoundationFormProps) {
  return (
    <div className="surface-shadow rounded-[1.5rem] border bg-card p-5 sm:p-7">
      <div
        className={`rounded-2xl border px-4 py-3.5 text-sm leading-6 ${
          configured
            ? "border-amber-500/20 bg-amber-500/[0.07] text-amber-900 dark:text-amber-200"
            : "border-orange-500/20 bg-orange-500/[0.07] text-orange-900 dark:text-orange-200"
        }`}
        role="status"
      >
        <p className="font-semibold">
          {configured ? messages.auth.pendingTitle : messages.auth.configurationTitle}
        </p>
        <p className="mt-1 opacity-80">
          {configured
            ? messages.auth.pendingDescription
            : messages.auth.configurationDescription}
        </p>
      </div>

      <form className="mt-6" aria-describedby="authentication-status">
        <fieldset disabled className="space-y-5 opacity-65">
          <legend className="sr-only">{messages.auth.title}</legend>
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
                placeholder={messages.auth.usernamePlaceholder}
                className="h-12 w-full rounded-xl border bg-background ps-10 pe-3 text-sm shadow-sm placeholder:text-muted-foreground/70"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="password" className="text-sm font-medium">
                {messages.auth.password}
              </label>
              <span className="text-xs font-medium text-primary">
                {messages.auth.forgotPassword}
              </span>
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
                placeholder={messages.auth.passwordPlaceholder}
                className="h-12 w-full rounded-xl border bg-background ps-10 pe-3 text-sm shadow-sm placeholder:text-muted-foreground/70"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="remember"
              className="size-4 rounded border-input accent-[hsl(var(--primary))]"
            />
            {messages.auth.remember}
          </label>

          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm"
          >
            {messages.auth.signIn}
          </button>
        </fieldset>
        <p id="authentication-status" className="sr-only">
          {messages.auth.pendingDescription}
        </p>
      </form>

      <Link
        href="/dashboard"
        className="mt-6 block rounded-lg text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {messages.auth.backToFoundation}
      </Link>
    </div>
  );
}
