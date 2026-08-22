"use client";

import { Save } from "lucide-react";
import { useActionState } from "react";

import { setAccountBalanceAction } from "@/app/actions/finance";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";

export function AccountBalanceForm({
  accountId,
  currency,
  currentBalance,
}: {
  accountId: string;
  currency: string;
  currentBalance: number;
}) {
  const [state, action, pending] = useActionState(
    setAccountBalanceAction,
    initialFinanceActionState,
  );

  return (
    <form action={action} className="mt-5 space-y-3 border-t pt-4">
      <input type="hidden" name="accountId" value={accountId} />
      <label htmlFor={`balance-${accountId}`} className="block text-xs font-semibold">
        Set current balance
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            id={`balance-${accountId}`}
            name="balance"
            type="text"
            inputMode="decimal"
            required
            defaultValue={currentBalance.toFixed(2)}
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.balance)}
            aria-describedby={`balance-error-${accountId}`}
            className="h-11 w-full rounded-xl border bg-background px-3 pe-14 text-sm font-semibold tabular-nums shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-55"
          />
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
            {currency}
          </span>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-55"
          aria-label={pending ? "Saving balance" : "Save balance"}
        >
          <Save aria-hidden="true" className="size-4" />
        </button>
      </div>
      <FieldError
        id={`balance-error-${accountId}`}
        errors={state.fieldErrors?.balance}
      />
      <FormStatus state={state} />
    </form>
  );
}
