import { CheckCircle2, CircleAlert } from "lucide-react";

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
    <div
      role={success ? "status" : "alert"}
      aria-live="polite"
      className={
        success
          ? "flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3.5 py-3 text-sm text-emerald-800 dark:text-emerald-300"
          : "flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/[0.06] px-3.5 py-3 text-sm text-destructive"
      }
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{state.message}</span>
    </div>
  );
}
