"use client";

import { CheckCircle2, KeyRound, LockKeyhole } from "lucide-react";
import { useActionState } from "react";

import { changePasswordAction } from "@/app/actions/auth";
import { initialAuthActionState } from "@/lib/auth/action-state";

type ChangePasswordFormProps = {
  recovery: boolean;
  requiredChange: boolean;
};

const requirements = [
  "At least 10 characters",
  "Uppercase and lowercase letters",
  "At least one number and one symbol",
  "Different from the temporary password",
];

export function ChangePasswordForm({
  recovery,
  requiredChange,
}: ChangePasswordFormProps) {
  const [state, action, pending] = useActionState(
    changePasswordAction,
    initialAuthActionState,
  );

  return (
    <div className="surface-shadow rounded-[1.5rem] border bg-card p-5 sm:p-7">
      <div className="mb-6">
        <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-primary/[0.09] text-primary">
          <KeyRound aria-hidden="true" className="size-5" />
        </div>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.035em]">
          {requiredChange ? "Make this account yours" : "Choose a new password"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {requiredChange
            ? "Your temporary password worked. Replace it now before entering the family workspace."
            : "Update the password for this household account."}
        </p>
      </div>

      <form action={action} className="space-y-4">
        {!recovery ? (
          <div>
            <label htmlFor="currentPassword" className="mb-2 block text-sm font-medium">
              Current password
            </label>
            <div className="relative">
              <LockKeyhole
                aria-hidden="true"
                className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                disabled={pending}
                className="h-12 w-full rounded-xl border bg-background ps-10 pe-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>
        ) : null}

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.password)}
            className="h-12 w-full rounded-xl border bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          {state.fieldErrors?.password?.[0] ? (
            <p className="mt-1.5 text-xs font-medium text-destructive">
              {state.fieldErrors.password[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="confirmation" className="mb-2 block text-sm font-medium">
            Confirm new password
          </label>
          <input
            id="confirmation"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            required
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.confirmation)}
            className="h-12 w-full rounded-xl border bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          {state.fieldErrors?.confirmation?.[0] ? (
            <p className="mt-1.5 text-xs font-medium text-destructive">
              {state.fieldErrors.confirmation[0]}
            </p>
          ) : null}
        </div>

        <ul className="grid gap-1.5 rounded-xl bg-muted/60 p-3.5 text-xs text-muted-foreground">
          {requirements.map((requirement) => (
            <li key={requirement} className="flex items-center gap-2">
              <CheckCircle2 aria-hidden="true" className="size-3.5 text-primary" />
              {requirement}
            </li>
          ))}
        </ul>

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
          disabled={pending}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {pending ? "Securing account…" : "Save new password"}
        </button>
      </form>
    </div>
  );
}
