"use client";

import { CheckCircle2, Save } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { updateAllocationDefaultsAction } from "@/app/actions/settings";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";
import type { SettingsPageCopy } from "@/lib/i18n/settings-copy";
import type { AllocationDefaults } from "@/lib/settings/config";

const allocationFields = [
  "essentials",
  "personal",
  "savings",
  "investment",
  "reserve",
] as const;

export function AllocationDefaultsForm({
  canManage,
  copy,
  defaults,
}: {
  canManage: boolean;
  copy: SettingsPageCopy["allocationForm"];
  defaults: AllocationDefaults;
}) {
  const [state, action, pending] = useActionState(
    updateAllocationDefaultsAction,
    initialFinanceActionState,
  );
  const [values, setValues] = useState<Record<keyof AllocationDefaults, string>>({
    essentials: String(defaults.essentials),
    personal: String(defaults.personal),
    savings: String(defaults.savings),
    investment: String(defaults.investment),
    reserve: String(defaults.reserve),
  });
  const total = useMemo(
    () =>
      Object.values(values).reduce((sum, value) => {
        const number = Number(value.replace(",", "."));
        return sum + (Number.isFinite(number) ? number : 0);
      }, 0),
    [values],
  );
  const balanced = Math.abs(total - 100) < 0.000001;

  return (
    <form action={action}>
      <div
        className={`mb-5 flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 ${
          balanced
            ? "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-800 dark:text-emerald-300"
            : "border-amber-500/20 bg-amber-500/[0.07] text-amber-900 dark:text-amber-300"
        }`}
        aria-live="polite"
      >
        <div>
          <p className="text-xs font-medium">{copy.total}</p>
          <p className="mt-0.5 font-display text-2xl font-semibold tabular-nums">
            {total.toFixed(2)}%
          </p>
        </div>
        {balanced ? <CheckCircle2 aria-hidden="true" className="size-5" /> : null}
      </div>

      <fieldset disabled={!canManage || pending} className="grid gap-4 sm:grid-cols-2">
        {allocationFields.map((field) => (
          <div key={field}>
            <label
              htmlFor={`default-${field}`}
              className="mb-2 block text-sm font-medium"
            >
              {copy.fields[field]}
            </label>
            <div className="relative">
              <input
                id={`default-${field}`}
                name={field}
                value={values[field]}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field]: event.target.value,
                  }))
                }
                inputMode="decimal"
                required
                className="h-12 w-full rounded-xl border bg-background px-3 pe-10 text-sm font-semibold tabular-nums shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:opacity-55"
                aria-invalid={Boolean(state.fieldErrors?.[field])}
                aria-describedby={`default-${field}-error`}
              />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
            <FieldError
              id={`default-${field}-error`}
              errors={state.fieldErrors?.[field]}
            />
          </div>
        ))}
      </fieldset>
      <FieldError
        id="allocation-default-total-error"
        errors={state.fieldErrors?.allocationTotal}
      />
      <div className="mt-5">
        <FormStatus state={state} />
        <button
          type="submit"
          disabled={!canManage || pending || !balanced}
          className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Save aria-hidden="true" className="size-4" />
          {pending ? copy.saving : copy.save}
        </button>
      </div>
    </form>
  );
}
