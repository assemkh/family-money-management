"use client";

import { Archive, RotateCcw, X } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import {
  setExpenseCategoryActiveAction,
  setIncomeSourceActiveAction,
} from "@/app/actions/settings";
import { FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";

export function ArchiveConfirmation({
  active,
  id,
  kind,
  label,
}: {
  active: boolean;
  id: string;
  kind: "category" | "income-source";
  label: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const action =
    kind === "category" ? setExpenseCategoryActiveAction : setIncomeSourceActiveAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialFinanceActionState,
  );

  useEffect(() => {
    if (state.status === "success") dialogRef.current?.close();
  }, [state.status]);

  if (!active) {
    return (
      <div>
        <form action={formAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="active" value="true" />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-emerald-500/25 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/[0.07] disabled:cursor-not-allowed disabled:opacity-55 dark:text-emerald-300"
          >
            <RotateCcw aria-hidden="true" className="size-3.5" />
            {pending ? "Restoring…" : "Restore"}
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
        <Archive aria-hidden="true" className="size-3.5" /> Archive
      </button>
      <dialog
        ref={dialogRef}
        className="w-[min(28rem,calc(100%-2rem))] rounded-[1.4rem] border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-black/45 backdrop:backdrop-blur-sm"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                Confirm archive
              </p>
              <h3 className="mt-2 text-balance font-display text-2xl font-semibold">
                Hide “{label}” from new entries?
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
            Historical records will remain unchanged. You can restore this item later
            from Settings.
          </p>
          <div className="mt-5">
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
            <form action={formAction}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="active" value="false" />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
              >
                <Archive aria-hidden="true" className="size-4" />
                {pending ? "Archiving…" : "Archive safely"}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}
