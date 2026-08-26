"use client";

import { Repeat2 } from "lucide-react";
import { useActionState, useState } from "react";

import { createRecurringAction } from "@/app/actions/finance";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import type { ExpenseCategoryOption } from "@/lib/finance/read-models/cash-flow/expenses";
import { initialFinanceActionState } from "@/lib/finance/action-state";

const fieldClass =
  "h-12 w-full rounded-xl border bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-55";

export function RecurringEntryForm({
  categories,
  defaultDate,
}: {
  categories: ExpenseCategoryOption[];
  defaultDate: string;
}) {
  const [frequency, setFrequency] = useState("monthly");
  const [state, action, pending] = useActionState(
    createRecurringAction,
    initialFinanceActionState,
  );
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="recurring-name" className="mb-2 block text-sm font-medium">
          Name
        </label>
        <input
          id="recurring-name"
          name="name"
          required
          disabled={pending}
          placeholder="Rent, salary, subscription…"
          className={fieldClass}
        />
        <FieldError id="recurring-name-error" errors={state.fieldErrors?.name} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="recurring-type" className="mb-2 block text-sm font-medium">
            Flow type
          </label>
          <select
            id="recurring-type"
            name="type"
            disabled={pending}
            className={fieldClass}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="savings">Savings</option>
            <option value="investment">Investment</option>
            <option value="liability_payment">Liability payment</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="recurring-category"
            className="mb-2 block text-sm font-medium"
          >
            Category{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <select
            id="recurring-category"
            name="categoryId"
            disabled={pending}
            className={fieldClass}
          >
            <option value="">Not linked</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="recurring-amount" className="mb-2 block text-sm font-medium">
            Amount
          </label>
          <input
            id="recurring-amount"
            name="amount"
            inputMode="decimal"
            required
            disabled={pending}
            className={fieldClass}
          />
          <FieldError id="recurring-amount-error" errors={state.fieldErrors?.amount} />
        </div>
        <div>
          <label
            htmlFor="recurring-currency"
            className="mb-2 block text-sm font-medium"
          >
            Currency
          </label>
          <select
            id="recurring-currency"
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="recurring-frequency"
            className="mb-2 block text-sm font-medium"
          >
            Frequency
          </label>
          <select
            id="recurring-frequency"
            name="frequency"
            value={frequency}
            onChange={(event) => setFrequency(event.target.value)}
            disabled={pending}
            className={fieldClass}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        {frequency === "custom" ? (
          <div>
            <label htmlFor="recurring-days" className="mb-2 block text-sm font-medium">
              Every number of days
            </label>
            <input
              id="recurring-days"
              name="customIntervalDays"
              type="number"
              min="1"
              max="3650"
              required
              disabled={pending}
              className={fieldClass}
            />
            <FieldError
              id="recurring-days-error"
              errors={state.fieldErrors?.customIntervalDays}
            />
          </div>
        ) : (
          <input type="hidden" name="customIntervalDays" value="" />
        )}
      </div>
      <div>
        <label htmlFor="recurring-due" className="mb-2 block text-sm font-medium">
          Next due date
        </label>
        <input
          id="recurring-due"
          name="nextDueDate"
          type="date"
          required
          defaultValue={defaultDate}
          disabled={pending}
          className={fieldClass}
        />
        <FieldError id="recurring-due-error" errors={state.fieldErrors?.nextDueDate} />
      </div>
      <div>
        <label htmlFor="recurring-note" className="mb-2 block text-sm font-medium">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="recurring-note"
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
        <Repeat2 aria-hidden="true" className="size-4" />
        {pending ? "Saving…" : "Save recurring item"}
      </button>
    </form>
  );
}
