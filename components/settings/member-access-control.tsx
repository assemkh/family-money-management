"use client";

import { LockKeyhole, RotateCcw, UserRoundX, X } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { setMemberActiveAction } from "@/app/actions/settings";
import { FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";

export function MemberAccessControl({
  active,
  id,
  label,
}: {
  active: boolean;
  id: string;
  label: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(
    setMemberActiveAction,
    initialFinanceActionState,
  );

  useEffect(() => {
    if (state.status === "success") dialogRef.current?.close();
  }, [state.status]);

  if (!active) {
    return (
      <div>
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="active" value="true" />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-emerald-500/25 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/[0.07] disabled:cursor-not-allowed disabled:opacity-55 dark:text-emerald-300"
          >
            <RotateCcw aria-hidden="true" className="size-3.5" />
            {pending ? "Restoring…" : "Restore access"}
          </button>
        </form>
        <div className="mt-2">
          <FormStatus state={state} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-amber-500/25 px-3 text-xs font-semibold text-amber-800 transition hover:bg-amber-500/[0.07] dark:text-amber-300"
      >
        <UserRoundX aria-hidden="true" className="size-3.5" /> Pause access
      </button>
      <dialog
        ref={dialogRef}
        className="w-[min(30rem,calc(100%-2rem))] rounded-[1.4rem] border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-black/45 backdrop:backdrop-blur-sm"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="grid size-11 place-items-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <LockKeyhole aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-4 text-balance font-display text-2xl font-semibold">
                Pause {label}’s family access?
              </h3>
            </div>
            <form method="dialog">
              <button
                type="submit"
                aria-label="Close confirmation"
                className="grid size-10 cursor-pointer place-items-center rounded-xl border text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </form>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Sign-in will be banned and Row Level Security will immediately stop this
            member from reading or changing family data. Financial history remains
            intact.
          </p>
          <div className="mt-4">
            <FormStatus state={state} />
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <form method="dialog">
              <button
                type="submit"
                className="min-h-11 w-full cursor-pointer rounded-xl border px-4 text-sm font-semibold transition hover:bg-muted sm:w-auto"
              >
                Keep active
              </button>
            </form>
            <form action={action}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="active" value="false" />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
              >
                <UserRoundX aria-hidden="true" className="size-4" />
                {pending ? "Pausing…" : "Pause securely"}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}
