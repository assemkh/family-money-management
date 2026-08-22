"use client";

import { HandCoins } from "lucide-react";
import { useActionState } from "react";

import { createLiabilityAction } from "@/app/actions/finance";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";

const fieldClass =
  "h-12 w-full rounded-xl border bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-55";

export function LiabilityEntryForm() {
  const [state, action, pending] = useActionState(
    createLiabilityAction,
    initialFinanceActionState,
  );
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="liability-name" className="mb-2 block text-sm font-medium">
          Name
        </label>
        <input
          id="liability-name"
          name="name"
          required
          disabled={pending}
          placeholder="Home loan"
          className={fieldClass}
        />
        <FieldError id="liability-name-error" errors={state.fieldErrors?.name} />
      </div>
      <div>
        <label htmlFor="liability-type" className="mb-2 block text-sm font-medium">
          Type
        </label>
        <input
          id="liability-type"
          name="type"
          required
          disabled={pending}
          placeholder="Loan, debt, mortgage…"
          className={fieldClass}
        />
        <FieldError id="liability-type-error" errors={state.fieldErrors?.type} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="liability-original"
            className="mb-2 block text-sm font-medium"
          >
            Original amount
          </label>
          <input
            id="liability-original"
            name="originalAmount"
            inputMode="decimal"
            required
            disabled={pending}
            className={fieldClass}
          />
          <FieldError
            id="liability-original-error"
            errors={state.fieldErrors?.originalAmount}
          />
        </div>
        <div>
          <label htmlFor="liability-paid" className="mb-2 block text-sm font-medium">
            Already paid
          </label>
          <input
            id="liability-paid"
            name="paidAmount"
            inputMode="decimal"
            required
            defaultValue="0"
            disabled={pending}
            className={fieldClass}
          />
          <FieldError
            id="liability-paid-error"
            errors={state.fieldErrors?.paidAmount}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="liability-payment" className="mb-2 block text-sm font-medium">
            Monthly payment{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="liability-payment"
            name="monthlyPayment"
            inputMode="decimal"
            disabled={pending}
            className={fieldClass}
          />
          <FieldError
            id="liability-payment-error"
            errors={state.fieldErrors?.monthlyPayment}
          />
        </div>
        <div>
          <label
            htmlFor="liability-currency"
            className="mb-2 block text-sm font-medium"
          >
            Currency
          </label>
          <select
            id="liability-currency"
            name="currency"
            disabled={pending}
            className={fieldClass}
          >
            <option>DZD</option>
            <option>EUR</option>
            <option>USD</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="liability-due" className="mb-2 block text-sm font-medium">
          Due date <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="liability-due"
          name="dueDate"
          type="date"
          disabled={pending}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="liability-note" className="mb-2 block text-sm font-medium">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="liability-note"
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
        <HandCoins aria-hidden="true" className="size-4" />
        {pending ? "Saving…" : "Save liability"}
      </button>
    </form>
  );
}
