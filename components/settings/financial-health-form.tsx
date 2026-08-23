"use client";

import { Save } from "lucide-react";
import { useActionState } from "react";

import { updateFinancialHealthSettingsAction } from "@/app/actions/settings";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";
import type { FinancialHealthSettings } from "@/lib/settings/config";

const fields = [
  {
    key: "positiveSavingRate",
    label: "Healthy saving rate",
    description: "Green at or above this rate",
  },
  {
    key: "neutralSavingRate",
    label: "Saving watch level",
    description: "Amber below this rate",
  },
  {
    key: "positivePlanVariancePercent",
    label: "Aligned plan gap",
    description: "Green at or below this gap",
  },
  {
    key: "warningPlanVariancePercent",
    label: "Plan warning gap",
    description: "Red above this gap",
  },
  {
    key: "essentialsWarningRatio",
    label: "Essentials warning",
    description: "Watch when essentials exceed income share",
  },
  {
    key: "positiveInvestmentRate",
    label: "Healthy investment rate",
    description: "Target invested share of income",
  },
  {
    key: "debtWarningRatio",
    label: "Debt warning ratio",
    description: "Watch debt payments above income share",
  },
  {
    key: "goalProgressTarget",
    label: "Goal progress target",
    description: "On-track completion percentage",
  },
] as const;

export function FinancialHealthForm({
  canManage,
  thresholds,
}: {
  canManage: boolean;
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
          <div key={field.key}>
            <label
              htmlFor={`health-${field.key}`}
              className="block text-sm font-medium"
            >
              {field.label}
            </label>
            <p className="mt-0.5 min-h-8 text-xs leading-4 text-muted-foreground">
              {field.description}
            </p>
            <div className="relative mt-2">
              <input
                id={`health-${field.key}`}
                name={field.key}
                defaultValue={values[field.key]}
                inputMode="decimal"
                required
                className="h-12 w-full rounded-xl border bg-background px-3 pe-10 text-sm font-semibold tabular-nums shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:opacity-55"
                aria-invalid={Boolean(state.fieldErrors?.[field.key])}
                aria-describedby={`health-${field.key}-error`}
              />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
            <FieldError
              id={`health-${field.key}-error`}
              errors={state.fieldErrors?.[field.key]}
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
          {pending ? "Saving…" : "Save health thresholds"}
        </button>
      </div>
    </form>
  );
}
