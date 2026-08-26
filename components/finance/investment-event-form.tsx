"use client";

import { TrendingUp } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { recordInvestmentEventAction } from "@/app/actions/finance";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";
import type { SupportedCurrency } from "@/lib/finance/validation";

type InvestmentOption = {
  id: string;
  name: string;
  currency: SupportedCurrency;
};

const fieldClass =
  "h-12 w-full rounded-xl border bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-55";

export function InvestmentEventForm({
  defaultDate,
  investments,
}: {
  defaultDate: string;
  investments: InvestmentOption[];
}) {
  const [state, action, pending] = useActionState(
    recordInvestmentEventAction,
    initialFinanceActionState,
  );
  const [investmentId, setInvestmentId] = useState(investments[0]?.id ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const selected =
    investments.find((investment) => investment.id === investmentId) ?? null;

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    amountRef.current?.focus();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <div>
        <label
          htmlFor="investment-event-amount"
          className="mb-2 block text-sm font-semibold"
        >
          Amount invested
        </label>
        <div className="relative">
          <input
            ref={amountRef}
            id="investment-event-amount"
            name="amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            required
            disabled={pending || !selected}
            placeholder="0.00"
            aria-invalid={Boolean(state.fieldErrors?.amount)}
            aria-describedby="investment-event-amount-error"
            className="h-16 w-full rounded-2xl border bg-background px-4 pe-24 font-display text-3xl font-semibold tracking-[-0.04em] shadow-sm outline-none transition placeholder:text-muted-foreground/35 focus:border-amber-600 focus:ring-4 focus:ring-amber-500/10 disabled:opacity-55"
          />
          <input type="hidden" name="currency" value={selected?.currency ?? "DZD"} />
          <span className="absolute end-2 top-2 grid h-12 min-w-16 place-items-center rounded-xl border bg-muted/70 px-2.5 text-sm font-semibold">
            {selected?.currency ?? "—"}
          </span>
        </div>
        <FieldError
          id="investment-event-amount-error"
          errors={state.fieldErrors?.amount}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="investment-event-position"
            className="mb-2 block text-sm font-medium"
          >
            Investment position
          </label>
          <select
            id="investment-event-position"
            name="investmentId"
            value={investmentId}
            onChange={(event) => setInvestmentId(event.target.value)}
            required
            disabled={pending || investments.length === 0}
            className={fieldClass}
          >
            {investments.length === 0 ? (
              <option value="">Create a position first</option>
            ) : null}
            {investments.map((investment) => (
              <option key={investment.id} value={investment.id}>
                {investment.name} · {investment.currency}
              </option>
            ))}
          </select>
          <FieldError
            id="investment-event-position-error"
            errors={state.fieldErrors?.investmentId}
          />
        </div>
        <div>
          <label
            htmlFor="investment-event-date"
            className="mb-2 block text-sm font-medium"
          >
            Investment date
          </label>
          <input
            id="investment-event-date"
            name="transactionDate"
            type="date"
            required
            defaultValue={defaultDate}
            disabled={pending || !selected}
            className={fieldClass}
          />
          <FieldError
            id="investment-event-date-error"
            errors={state.fieldErrors?.transactionDate}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="investment-event-note"
          className="mb-2 block text-sm font-medium"
        >
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="investment-event-note"
          name="note"
          rows={3}
          maxLength={2000}
          disabled={pending || !selected}
          placeholder="Monthly contribution, additional units…"
          className="w-full resize-y rounded-xl border bg-background px-3 py-3 text-sm shadow-sm outline-none transition focus:border-amber-600 focus:ring-4 focus:ring-amber-500/10 disabled:opacity-55"
        />
      </div>

      <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3.5 py-3 text-xs leading-5 text-amber-900 dark:text-amber-200">
        This is the source record for actual monthly investment. It increases invested
        cost and current position value together, but does not debit an account balance
        automatically.
      </p>
      <FormStatus state={state} />
      <button
        type="submit"
        disabled={pending || !selected}
        className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-800 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 dark:bg-amber-600 dark:hover:bg-amber-500"
      >
        <TrendingUp aria-hidden="true" className="size-4" />
        {pending ? "Recording investment…" : "Record investment"}
      </button>
    </form>
  );
}
