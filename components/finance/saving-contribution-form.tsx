"use client";

import { PiggyBank } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { recordSavingContributionAction } from "@/app/actions/finance";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";
import type { SavingsGoal } from "@/lib/finance/read-models/planning/goals";

const fieldClass =
  "h-12 w-full rounded-xl border bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-55";

export function SavingContributionForm({
  defaultDate,
  goals,
}: {
  defaultDate: string;
  goals: SavingsGoal[];
}) {
  const [state, action, pending] = useActionState(
    recordSavingContributionAction,
    initialFinanceActionState,
  );
  const [goalId, setGoalId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const selectedGoal = goals.find((goal) => goal.id === goalId) ?? null;

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    amountRef.current?.focus();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <div>
        <label htmlFor="saving-amount" className="mb-2 block text-sm font-semibold">
          Amount saved
        </label>
        <div className="relative">
          <input
            ref={amountRef}
            id="saving-amount"
            name="amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            required
            disabled={pending}
            placeholder="0.00"
            aria-invalid={Boolean(state.fieldErrors?.amount)}
            aria-describedby="saving-amount-error"
            className="h-16 w-full rounded-2xl border bg-background px-4 pe-24 font-display text-3xl font-semibold tracking-[-0.04em] shadow-sm outline-none transition placeholder:text-muted-foreground/35 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-55"
          />
          {selectedGoal ? (
            <>
              <input type="hidden" name="currency" value={selectedGoal.currency} />
              <span className="absolute end-2 top-2 grid h-12 min-w-16 place-items-center rounded-xl border bg-muted/70 px-2.5 text-sm font-semibold">
                {selectedGoal.currency}
              </span>
            </>
          ) : (
            <select
              name="currency"
              defaultValue="DZD"
              aria-label="Savings currency"
              disabled={pending}
              className="absolute end-2 top-2 h-12 rounded-xl border bg-muted/70 px-2.5 text-sm font-semibold outline-none focus:border-emerald-600"
            >
              <option value="DZD">DZD</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          )}
        </div>
        <FieldError id="saving-amount-error" errors={state.fieldErrors?.amount} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="saving-goal" className="mb-2 block text-sm font-medium">
            Put toward
          </label>
          <select
            id="saving-goal"
            name="goalId"
            value={goalId}
            onChange={(event) => setGoalId(event.target.value)}
            disabled={pending}
            className={fieldClass}
          >
            <option value="">General savings</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.name} · {goal.currency}
              </option>
            ))}
          </select>
          <FieldError id="saving-goal-error" errors={state.fieldErrors?.goalId} />
        </div>
        <div>
          <label htmlFor="saving-date" className="mb-2 block text-sm font-medium">
            Date saved
          </label>
          <input
            id="saving-date"
            name="transactionDate"
            type="date"
            required
            defaultValue={defaultDate}
            disabled={pending}
            className={fieldClass}
          />
          <FieldError
            id="saving-date-error"
            errors={state.fieldErrors?.transactionDate}
          />
        </div>
      </div>

      <div>
        <label htmlFor="saving-note" className="mb-2 block text-sm font-medium">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="saving-note"
          name="note"
          rows={3}
          maxLength={2000}
          disabled={pending}
          placeholder="Salary transfer, cash set aside…"
          className="w-full resize-y rounded-xl border bg-background px-3 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-55"
        />
      </div>

      <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3.5 py-3 text-xs leading-5 text-emerald-900 dark:text-emerald-200">
        This creates a real savings event. It is not counted as spending and does not
        move an account balance automatically.
      </p>
      <FormStatus state={state} />
      <button
        type="submit"
        disabled={pending}
        className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        <PiggyBank aria-hidden="true" className="size-4" />
        {pending ? "Recording savings…" : "Record savings"}
      </button>
    </form>
  );
}
