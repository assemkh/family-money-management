"use client";

import { RefreshCw } from "lucide-react";
import { useActionState } from "react";

import { saveExchangeRateAction } from "@/app/actions/finance";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import type { ManualExchangeRate } from "@/lib/finance/valuation/rates";
import { initialFinanceActionState } from "@/lib/finance/action-state";
import type { SettingsPageCopy } from "@/lib/i18n/settings-copy";

const defaultCopy: SettingsPageCopy["exchangeRateForm"] = {
  inDzd: "in DZD",
  currentSince: "Current since",
  noRate: "No manual rate yet",
  rate: "Rate",
  effectiveDate: "Effective date",
  save: "Save rate",
  saving: "Saving…",
};

export function ExchangeRateForm({
  defaultDate,
  copy = defaultCopy,
  exchangeRate,
}: {
  defaultDate: string;
  copy?: SettingsPageCopy["exchangeRateForm"];
  exchangeRate: ManualExchangeRate;
}) {
  const [state, action, pending] = useActionState(
    saveExchangeRateAction,
    initialFinanceActionState,
  );

  return (
    <form action={action} className="rounded-2xl border bg-muted/30 p-4">
      <input type="hidden" name="currency" value={exchangeRate.currency} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            1 {exchangeRate.currency} {copy.inDzd}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {exchangeRate.effectiveDate
              ? `${copy.currentSince} ${exchangeRate.effectiveDate}`
              : copy.noRate}
          </p>
        </div>
        <RefreshCw aria-hidden="true" className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label
            htmlFor={`rate-${exchangeRate.currency}`}
            className="mb-1.5 block text-xs font-medium"
          >
            {copy.rate}
          </label>
          <input
            id={`rate-${exchangeRate.currency}`}
            name="rate"
            type="text"
            inputMode="decimal"
            required
            defaultValue={exchangeRate.rate ?? ""}
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.rate)}
            aria-describedby={`rate-error-${exchangeRate.currency}`}
            placeholder="0.000000"
            className="h-11 w-full rounded-xl border bg-background px-3 text-sm font-semibold tabular-nums shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-55"
          />
          <FieldError
            id={`rate-error-${exchangeRate.currency}`}
            errors={state.fieldErrors?.rate}
          />
        </div>
        <div>
          <label
            htmlFor={`rate-date-${exchangeRate.currency}`}
            className="mb-1.5 block text-xs font-medium"
          >
            {copy.effectiveDate}
          </label>
          <input
            id={`rate-date-${exchangeRate.currency}`}
            name="effectiveDate"
            type="date"
            required
            defaultValue={exchangeRate.effectiveDate ?? defaultDate}
            disabled={pending}
            className="h-11 w-full rounded-xl border bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-55"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-11 cursor-pointer self-end rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {pending ? copy.saving : copy.save}
        </button>
      </div>
      <div className="mt-3">
        <FormStatus state={state} />
      </div>
    </form>
  );
}
