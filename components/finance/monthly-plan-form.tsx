"use client";

import { Check, RotateCcw } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { saveMonthlyPlanAction } from "@/app/actions/finance";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";
import type { MonthlyPlanAllocation } from "@/lib/finance/read-models/planning/monthly-plan";

const allocationFields = [
  {
    key: "essentials",
    name: "essentialsPercent",
    label: "Essentials",
    tone: "bg-blue-600",
  },
  {
    key: "personal",
    name: "personalPercent",
    label: "Personal",
    tone: "bg-violet-500",
  },
  { key: "savings", name: "savingsPercent", label: "Savings", tone: "bg-emerald-500" },
  {
    key: "investment",
    name: "investmentPercent",
    label: "Investment",
    tone: "bg-amber-500",
  },
  { key: "reserve", name: "reservePercent", label: "Reserve", tone: "bg-slate-500" },
] as const;

const inputClass =
  "h-12 w-full rounded-xl border bg-background px-3 pe-10 text-sm font-semibold tabular-nums shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-55";

export function MonthlyPlanForm({
  allocation,
  isRevision,
  month,
  nextVersion,
}: {
  allocation: MonthlyPlanAllocation;
  isRevision: boolean;
  month: string;
  nextVersion: number;
}) {
  const [values, setValues] = useState<Record<keyof MonthlyPlanAllocation, string>>({
    essentials: String(allocation.essentials),
    personal: String(allocation.personal),
    savings: String(allocation.savings),
    investment: String(allocation.investment),
    reserve: String(allocation.reserve),
  });
  const [state, action, pending] = useActionState(
    saveMonthlyPlanAction,
    initialFinanceActionState,
  );
  const total = useMemo(
    () => Object.values(values).reduce((sum, value) => sum + (Number(value) || 0), 0),
    [values],
  );
  const isComplete = Math.abs(total - 100) < 0.000001;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="month" value={month} />
      <div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Allocation total</p>
            <p className="mt-1 text-xs text-muted-foreground">
              All five areas must add up to exactly 100%.
            </p>
          </div>
          <p
            className={`font-display text-3xl font-semibold tabular-nums ${isComplete ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}
          >
            {total.toFixed(2)}%
          </p>
        </div>
        <div
          className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={`Current monthly allocation totals ${total.toFixed(2)} percent`}
        >
          {allocationFields.map((field) => (
            <span
              key={field.key}
              className={field.tone}
              style={{
                width: `${Math.max(0, Math.min(Number(values[field.key]) || 0, 100))}%`,
              }}
            />
          ))}
        </div>
        {!isComplete ? (
          <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
            {total < 100
              ? `${(100 - total).toFixed(2)}% remains to allocate.`
              : `Reduce the plan by ${(total - 100).toFixed(2)}%.`}
          </p>
        ) : (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <Check aria-hidden="true" className="size-3.5" />
            Ready to activate.
          </p>
        )}
        <FieldError
          id="allocation-total-error"
          errors={state.fieldErrors?.allocationTotal}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {allocationFields.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={`plan-${field.key}`}
              className="mb-2 flex items-center gap-2 text-sm font-medium"
            >
              <span className={`size-2.5 rounded-full ${field.tone}`} />
              {field.label}
            </label>
            <div className="relative">
              <input
                id={`plan-${field.key}`}
                name={field.name}
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.01"
                required
                disabled={pending}
                value={values[field.key]}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
                className={inputClass}
              />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                %
              </span>
            </div>
            <FieldError
              id={`plan-${field.key}-error`}
              errors={state.fieldErrors?.[field.name]}
            />
          </div>
        ))}
      </div>

      <div>
        <label htmlFor="plan-reason" className="mb-2 block text-sm font-medium">
          {isRevision ? "Reason for revision" : "Planning note"}
        </label>
        <textarea
          id="plan-reason"
          name="reason"
          rows={3}
          minLength={1}
          maxLength={500}
          required
          disabled={pending}
          placeholder={
            isRevision
              ? "What changed since the previous version?"
              : "Why does this allocation fit this month?"
          }
          className="w-full resize-y rounded-xl border bg-background px-3 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-55"
        />
        <FieldError id="plan-reason-error" errors={state.fieldErrors?.reason} />
      </div>

      <FormStatus state={state} />
      <button
        type="submit"
        disabled={pending || !isComplete}
        className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-55"
      >
        <RotateCcw aria-hidden="true" className="size-4" />
        {pending
          ? "Activating version…"
          : isRevision
            ? `Create and activate version ${nextVersion}`
            : "Activate monthly plan"}
      </button>
    </form>
  );
}
