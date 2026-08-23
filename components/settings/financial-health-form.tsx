"use client";

import { Save } from "lucide-react";
import { useActionState } from "react";

import { updateFinancialHealthSettingsAction } from "@/app/actions/settings";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";
import type { SettingsPageCopy } from "@/lib/i18n/settings-copy";
import type { FinancialHealthSettings } from "@/lib/settings/config";

const fields = [
  "positiveSavingRate",
  "neutralSavingRate",
  "positivePlanVariancePercent",
  "warningPlanVariancePercent",
  "essentialsWarningRatio",
  "positiveInvestmentRate",
  "debtWarningRatio",
  "goalProgressTarget",
] as const;

export function FinancialHealthForm({
  canManage,
  copy,
  thresholds,
}: {
  canManage: boolean;
  copy: SettingsPageCopy["healthForm"];
  thresholds: FinancialHealthSettings;
}) {
  const [state, action, pending] = useActionState(
    updateFinancialHealthSettingsAction,
    initialFinanceActionState,
  );
  const values = {
    ...thresholds,
    positivePlanVariancePercent: thresholds.positivePlanVariance * 100,
    warningPlanVariancePercent: thresholds.warningPlanVariance * 100,
  };

  return (
    <form action={action}>
      <fieldset disabled={!canManage || pending} className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field}>
            <label htmlFor={`health-${field}`} className="block text-sm font-medium">
              {copy.fields[field].label}
            </label>
            <p className="mt-0.5 min-h-8 text-xs leading-4 text-muted-foreground">
              {copy.fields[field].description}
            </p>
            <div className="relative mt-2">
              <input
                id={`health-${field}`}
                name={field}
                defaultValue={values[field]}
                inputMode="decimal"
                required
                className="h-12 w-full rounded-xl border bg-background px-3 pe-10 text-sm font-semibold tabular-nums shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:opacity-55"
                aria-invalid={Boolean(state.fieldErrors?.[field])}
                aria-describedby={`health-${field}-error`}
              />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
            <FieldError
              id={`health-${field}-error`}
              errors={state.fieldErrors?.[field]}
            />
          </div>
        ))}
      </fieldset>
      <div className="mt-5">
        <FormStatus state={state} />
        <button
          type="submit"
          disabled={!canManage || pending}
          className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Save aria-hidden="true" className="size-4" />
          {pending ? copy.saving : copy.save}
        </button>
      </div>
    </form>
  );
}
