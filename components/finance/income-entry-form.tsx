"use client";

import { ArrowDownToLine } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { createIncomeEntryAction } from "@/app/actions/finance";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import type { IncomeSourceOption } from "@/lib/finance/read-models/cash-flow/income";
import { initialFinanceActionState } from "@/lib/finance/action-state";

const fieldClass =
  "h-12 w-full rounded-xl border bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-55";

export function IncomeEntryForm({
  defaultMonth,
  sources,
}: {
  defaultMonth: string;
  sources: IncomeSourceOption[];
}) {
  const [state, action, pending] = useActionState(
    createIncomeEntryAction,
    initialFinanceActionState,
  );
  const amountRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const availableSources = sources.filter((source) => source.available);

  useEffect(() => {
    if (state.status !== "success") return;
    if (amountRef.current) amountRef.current.value = "";
    if (noteRef.current) noteRef.current.value = "";
    amountRef.current?.focus();
  }, [state]);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="income-amount" className="mb-2 block text-sm font-semibold">
          Amount
        </label>
        <div className="relative">
          <input
            ref={amountRef}
            id="income-amount"
            name="amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            required
            disabled={pending || availableSources.length === 0}
            aria-invalid={Boolean(state.fieldErrors?.amount)}
            aria-describedby="income-amount-error"
            placeholder="0.00"
            className="h-16 w-full rounded-2xl border bg-background px-4 pe-24 font-display text-3xl font-semibold tracking-[-0.04em] shadow-sm outline-none transition placeholder:text-muted-foreground/35 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-55"
          />
          <select
            name="currency"
            defaultValue="DZD"
            aria-label="Income currency"
            disabled={pending || availableSources.length === 0}
            className="absolute end-2 top-2 h-12 rounded-xl border bg-muted/70 px-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            <option value="DZD">DZD</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <FieldError id="income-amount-error" errors={state.fieldErrors?.amount} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="income-source" className="mb-2 block text-sm font-medium">
            Income source
          </label>
          <select
            id="income-source"
            name="sourceId"
            required
            disabled={pending || availableSources.length === 0}
            aria-invalid={Boolean(state.fieldErrors?.sourceId)}
            aria-describedby="income-source-error"
            className={fieldClass}
            defaultValue={availableSources[0]?.id ?? ""}
          >
            {availableSources.length === 0 ? (
              <option value="">No assigned sources</option>
            ) : null}
            {sources.map((source) => (
              <option key={source.id} value={source.id} disabled={!source.available}>
                {source.memberName
                  ? `${source.memberName} · ${source.name}`
                  : `${source.name} · assign member first`}
              </option>
            ))}
          </select>
          <FieldError id="income-source-error" errors={state.fieldErrors?.sourceId} />
        </div>

        <div>
          <label htmlFor="income-month" className="mb-2 block text-sm font-medium">
            Income month
          </label>
          <input
            id="income-month"
            name="month"
            type="month"
            required
            defaultValue={defaultMonth}
            disabled={pending || availableSources.length === 0}
            aria-invalid={Boolean(state.fieldErrors?.month)}
            aria-describedby="income-month-error"
            className={fieldClass}
          />
          <FieldError id="income-month-error" errors={state.fieldErrors?.month} />
        </div>
      </div>

      <div>
        <label htmlFor="income-note" className="mb-2 block text-sm font-medium">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          ref={noteRef}
          id="income-note"
          name="note"
          rows={3}
          maxLength={2000}
          disabled={pending || availableSources.length === 0}
          className="w-full resize-y rounded-xl border bg-background px-3 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-55"
          placeholder="Salary, freelance invoice, bonus…"
        />
      </div>

      <p className="rounded-xl border border-primary/15 bg-primary/[0.05] px-3.5 py-3 text-xs leading-5 text-muted-foreground">
        Income updates monthly cash-flow reporting. It does not credit an account
        balance automatically; update the receiving account separately when needed.
      </p>

      {availableSources.length === 0 ? (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-3.5 py-3 text-sm text-amber-800 dark:text-amber-300">
          An owner needs to assign an income source to a family member before income can
          be recorded.
        </p>
      ) : null}

      <FormStatus state={state} />

      <button
        type="submit"
        disabled={pending || availableSources.length === 0}
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
      >
        <ArrowDownToLine aria-hidden="true" className="size-4" />
        {pending ? "Saving income…" : "Save income"}
      </button>
    </form>
  );
}
