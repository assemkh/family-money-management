"use client";

import { ReceiptText } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { createExpenseEntryAction } from "@/app/actions/finance";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import type { AccountOption, ExpenseCategoryOption } from "@/lib/finance/data";
import { initialFinanceActionState } from "@/lib/finance/action-state";

const fieldClass =
  "h-12 w-full rounded-xl border bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-55";

const categoryLabels: Record<string, string> = {
  essentials: "Essentials",
  personal: "Personal",
  savings: "Savings",
  investment: "Investment",
  reserve: "Reserve",
  liability: "Liability",
  other: "Other",
};

export function ExpenseEntryForm({
  accounts,
  categories,
  currentMemberName,
  defaultDate,
}: {
  accounts: AccountOption[];
  categories: ExpenseCategoryOption[];
  currentMemberName: string;
  defaultDate: string;
}) {
  const [state, action, pending] = useActionState(
    createExpenseEntryAction,
    initialFinanceActionState,
  );
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const amountRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const groupedCategories = Object.entries(
    categories.reduce<Record<string, ExpenseCategoryOption[]>>((groups, category) => {
      groups[category.type] = [...(groups[category.type] ?? []), category];
      return groups;
    }, {}),
  );

  useEffect(() => {
    if (state.status !== "success") return;
    if (amountRef.current) amountRef.current.value = "";
    if (noteRef.current) noteRef.current.value = "";
    amountRef.current?.focus();
  }, [state]);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="expense-amount" className="mb-2 block text-sm font-semibold">
          Amount
        </label>
        <div className="relative">
          <input
            ref={amountRef}
            id="expense-amount"
            name="amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            required
            autoFocus
            disabled={pending || categories.length === 0}
            aria-invalid={Boolean(state.fieldErrors?.amount)}
            aria-describedby="expense-amount-error"
            placeholder="0.00"
            className="h-16 w-full rounded-2xl border bg-background px-4 pe-24 font-display text-3xl font-semibold tracking-[-0.04em] shadow-sm outline-none transition placeholder:text-muted-foreground/35 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-55"
          />
          <select
            name="currency"
            defaultValue="DZD"
            aria-label="Expense currency"
            disabled={pending || categories.length === 0}
            className="absolute end-2 top-2 h-12 rounded-xl border bg-muted/70 px-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            <option value="DZD">DZD</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <FieldError id="expense-amount-error" errors={state.fieldErrors?.amount} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="expense-category" className="mb-2 block text-sm font-medium">
            Category
          </label>
          <select
            id="expense-category"
            name="categoryId"
            required
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            disabled={pending || categories.length === 0}
            aria-invalid={Boolean(state.fieldErrors?.categoryId)}
            aria-describedby="expense-category-error"
            className={fieldClass}
          >
            {categories.length === 0 ? <option value="">No categories</option> : null}
            {groupedCategories.map(([type, items]) => (
              <optgroup key={type} label={categoryLabels[type] ?? type}>
                {items.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <FieldError
            id="expense-category-error"
            errors={state.fieldErrors?.categoryId}
          />
        </div>

        <div>
          <label htmlFor="expense-date" className="mb-2 block text-sm font-medium">
            Date
          </label>
          <input
            id="expense-date"
            name="transactionDate"
            type="date"
            required
            defaultValue={defaultDate}
            disabled={pending || categories.length === 0}
            aria-invalid={Boolean(state.fieldErrors?.transactionDate)}
            aria-describedby="expense-date-error"
            className={fieldClass}
          />
          <FieldError
            id="expense-date-error"
            errors={state.fieldErrors?.transactionDate}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="expense-member" className="mb-2 block text-sm font-medium">
            Person
          </label>
          <input
            id="expense-member"
            value={currentMemberName}
            readOnly
            disabled
            className={fieldClass}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Securely derived from the signed-in account.
          </p>
        </div>

        <div>
          <label htmlFor="expense-account" className="mb-2 block text-sm font-medium">
            Payment account{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <select
            id="expense-account"
            name="accountId"
            defaultValue=""
            disabled={pending || categories.length === 0}
            aria-invalid={Boolean(state.fieldErrors?.accountId)}
            aria-describedby="expense-account-help expense-account-error"
            className={fieldClass}
          >
            <option value="">Not linked</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.currency}
              </option>
            ))}
          </select>
          <p id="expense-account-help" className="mt-1.5 text-xs text-muted-foreground">
            Balance automation is part of the Accounts slice later in Phase 2A.
          </p>
          <FieldError
            id="expense-account-error"
            errors={state.fieldErrors?.accountId}
          />
        </div>
      </div>

      <div>
        <label htmlFor="expense-note" className="mb-2 block text-sm font-medium">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          ref={noteRef}
          id="expense-note"
          name="note"
          rows={3}
          maxLength={2000}
          disabled={pending || categories.length === 0}
          className="w-full resize-y rounded-xl border bg-background px-3 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-55"
          placeholder="What was this for?"
        />
      </div>

      <FormStatus state={state} />

      <button
        type="submit"
        disabled={pending || categories.length === 0}
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
      >
        <ReceiptText aria-hidden="true" className="size-4" />
        {pending ? "Saving expense…" : "Save expense"}
      </button>
    </form>
  );
}
