"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import type { FinanceActionState } from "@/lib/finance/action-state";

export function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.[0]) return null;

  return (
    <p id={id} className="mt-1.5 text-xs font-medium text-destructive">
      {errors[0]}
    </p>
  );
}

export function FormStatus({ state }: { state: FinanceActionState }) {
  if (!state.message) return null;

  const success = state.status === "success";
  const Icon = success ? CheckCircle2 : CircleAlert;

  return (
    <>
      <div
        className={
          success
            ? "flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3.5 py-3 text-sm text-emerald-800 dark:text-emerald-300"
            : "flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/[0.06] px-3.5 py-3 text-sm text-destructive"
        }
      >
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>{state.message}</span>
      </div>
      <ActionToast state={state} />
    </>
  );
}

function ActionToast({ state }: { state: FinanceActionState }) {
  const [expiredState, setExpiredState] = useState<FinanceActionState | null>(null);
  const success = state.status === "success";
  const Icon = success ? CheckCircle2 : CircleAlert;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setExpiredState(state), 5000);

    return () => window.clearTimeout(timeoutId);
  }, [state]);

  if (expiredState === state || !state.message) return null;

  return (
    <div
      role={success ? "status" : "alert"}
      aria-live={success ? "polite" : "assertive"}
      className={
        success
          ? "surface-shadow fixed bottom-5 end-5 z-[100] flex w-[min(24rem,calc(100%-2.5rem))] items-start gap-3 rounded-2xl border border-emerald-500/25 bg-card px-4 py-3.5 text-sm text-emerald-800 motion-safe:animate-in motion-safe:slide-in-from-bottom-3 dark:text-emerald-300"
          : "surface-shadow fixed bottom-5 end-5 z-[100] flex w-[min(24rem,calc(100%-2.5rem))] items-start gap-3 rounded-2xl border border-destructive/25 bg-card px-4 py-3.5 text-sm text-destructive motion-safe:animate-in motion-safe:slide-in-from-bottom-3"
      }
    >
      <span
        className={
          success
            ? "grid size-7 shrink-0 place-items-center rounded-full bg-emerald-500/10"
            : "grid size-7 shrink-0 place-items-center rounded-full bg-destructive/10"
        }
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span className="pt-1 font-medium leading-5">{state.message}</span>
    </div>
  );
}
