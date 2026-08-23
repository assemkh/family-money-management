"use client";

import { KeyRound, LogOut, MonitorX } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { logoutAction } from "@/app/actions/auth";
import { revokeOtherSessionsAction } from "@/app/actions/settings";
import { FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";

export function SecurityControls() {
  const [state, action, pending] = useActionState(
    revokeOtherSessionsAction,
    initialFinanceActionState,
  );

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Link
        href="/change-password"
        className="group rounded-2xl border bg-background p-4 transition hover:border-primary/30"
      >
        <KeyRound aria-hidden="true" className="size-5 text-primary" />
        <p className="mt-4 text-sm font-semibold group-hover:text-primary">
          Change password
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Replace your current password and keep this session.
        </p>
      </Link>

      <div className="rounded-2xl border bg-background p-4">
        <MonitorX aria-hidden="true" className="size-5 text-primary" />
        <p className="mt-4 text-sm font-semibold">Revoke other sessions</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Keep this device signed in and remove every other session.
        </p>
        <form action={action} className="mt-4">
          <button
            type="submit"
            disabled={pending}
            className="min-h-10 cursor-pointer rounded-xl border px-3 text-xs font-semibold transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-55"
          >
            {pending ? "Revoking…" : "Revoke others"}
          </button>
        </form>
        <div className="mt-2">
          <FormStatus state={state} />
        </div>
      </div>

      <div className="rounded-2xl border border-rose-500/15 bg-rose-500/[0.035] p-4">
        <LogOut
          aria-hidden="true"
          className="size-5 text-rose-700 dark:text-rose-300"
        />
        <p className="mt-4 text-sm font-semibold">Sign out everywhere</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          End this session and every other session for your account.
        </p>
        <form action={logoutAction} className="mt-4">
          <input type="hidden" name="scope" value="global" />
          <button
            type="submit"
            className="min-h-10 cursor-pointer rounded-xl border border-rose-500/25 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-500/[0.07] dark:text-rose-300"
          >
            Sign out everywhere
          </button>
        </form>
      </div>
    </div>
  );
}
