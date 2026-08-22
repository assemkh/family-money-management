"use client";

import { Gem, TrendingUp } from "lucide-react";
import { useActionState } from "react";

import { createAssetAction, createInvestmentAction } from "@/app/actions/finance";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";

const fieldClass =
  "h-12 w-full rounded-xl border bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-55";

export function PortfolioEntryForm({
  kind,
  defaultDate,
}: {
  kind: "asset" | "investment";
  defaultDate: string;
}) {
  const isAsset = kind === "asset";
  const [state, action, pending] = useActionState(
    isAsset ? createAssetAction : createInvestmentAction,
    initialFinanceActionState,
  );
  const Icon = isAsset ? Gem : TrendingUp;
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor={`${kind}-name`} className="mb-2 block text-sm font-medium">
          Name
        </label>
        <input
          id={`${kind}-name`}
          name="name"
          required
          disabled={pending}
          placeholder={isAsset ? "Gold bracelet" : "Index fund"}
          className={fieldClass}
        />
        <FieldError id={`${kind}-name-error`} errors={state.fieldErrors?.name} />
      </div>
      {isAsset ? (
        <div>
          <label htmlFor="asset-type" className="mb-2 block text-sm font-medium">
            Asset type
          </label>
          <select
            id="asset-type"
            name="assetType"
            disabled={pending}
            className={fieldClass}
          >
            <option value="gold">Gold</option>
            <option value="other">Other asset</option>
          </select>
        </div>
      ) : (
        <div>
          <label htmlFor="investment-type" className="mb-2 block text-sm font-medium">
            Investment type
          </label>
          <input
            id="investment-type"
            name="type"
            required
            disabled={pending}
            placeholder="Fund, stock, property…"
            className={fieldClass}
          />
          <FieldError id="investment-type-error" errors={state.fieldErrors?.type} />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${kind}-purchase`}
            className="mb-2 block text-sm font-medium"
          >
            Purchase value
          </label>
          <input
            id={`${kind}-purchase`}
            name="purchaseValue"
            inputMode="decimal"
            required
            disabled={pending}
            placeholder="0.00"
            className={fieldClass}
          />
          <FieldError
            id={`${kind}-purchase-error`}
            errors={state.fieldErrors?.purchaseValue}
          />
        </div>
        <div>
          <label htmlFor={`${kind}-current`} className="mb-2 block text-sm font-medium">
            Current value
          </label>
          <input
            id={`${kind}-current`}
            name="currentValue"
            inputMode="decimal"
            required
            disabled={pending}
            placeholder="0.00"
            className={fieldClass}
          />
          <FieldError
            id={`${kind}-current-error`}
            errors={state.fieldErrors?.currentValue}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${kind}-currency`}
            className="mb-2 block text-sm font-medium"
          >
            Currency
          </label>
          <select
            id={`${kind}-currency`}
            name="currency"
            disabled={pending}
            className={fieldClass}
          >
            <option>DZD</option>
            <option>EUR</option>
            <option>USD</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${kind}-date`} className="mb-2 block text-sm font-medium">
            Purchase date{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id={`${kind}-date`}
            name="purchaseDate"
            type="date"
            max={defaultDate}
            disabled={pending}
            className={fieldClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${kind}-note`} className="mb-2 block text-sm font-medium">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id={`${kind}-note`}
          name="note"
          rows={3}
          maxLength={2000}
          disabled={pending}
          className="w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>
      <FormStatus state={state} />
      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-55"
      >
        <Icon aria-hidden="true" className="size-4" />
        {pending ? "Saving…" : `Save ${kind}`}
      </button>
    </form>
  );
}
