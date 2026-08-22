"use client";

import { Target } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { createSavingsGoalAction } from "@/app/actions/finance";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";

const fieldClass =
  "h-12 w-full rounded-xl border bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-55";

export function SavingsGoalForm() {
  const [state, action, pending] = useActionState(
    createSavingsGoalAction,
    initialFinanceActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <div>
        <label htmlFor="goal-name" className="mb-2 block text-sm font-semibold">
          Goal name
        </label>
        <input
          id="goal-name"
          name="name"
          type="text"
          maxLength={100}
          required
          disabled={pending}
          placeholder="Emergency fund, travel, a new car…"
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby="goal-name-error"
          className={fieldClass}
        />
        <FieldError id="goal-name-error" errors={state.fieldErrors?.name} />
      </div>

      <div>
        <label htmlFor="goal-target" className="mb-2 block text-sm font-semibold">
          Target amount
        </label>
        <div className="relative">
          <input
            id="goal-target"
            name="targetAmount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            required
            disabled={pending}
            placeholder="0.00"
            aria-invalid={Boolean(state.fieldErrors?.targetAmount)}
            aria-describedby="goal-target-error"
            className="h-16 w-full rounded-2xl border bg-background px-4 pe-24 font-display text-3xl font-semibold tracking-[-0.04em] shadow-sm outline-none transition placeholder:text-muted-foreground/35 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-55"
          />
          <select
            name="currency"
            defaultValue="DZD"
            aria-label="Goal currency"
            disabled={pending}
            className="absolute end-2 top-2 h-12 rounded-xl border bg-muted/70 px-2.5 text-sm font-semibold outline-none focus:border-primary"
          >
            <option value="DZD">DZD</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <FieldError id="goal-target-error" errors={state.fieldErrors?.targetAmount} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="goal-date" className="mb-2 block text-sm font-medium">
            Target date{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="goal-date"
            name="targetDate"
            type="date"
            disabled={pending}
            className={fieldClass}
          />
          <FieldError id="goal-date-error" errors={state.fieldErrors?.targetDate} />
        </div>
        <div>
          <label htmlFor="goal-priority" className="mb-2 block text-sm font-medium">
            Priority
          </label>
          <select
            id="goal-priority"
            name="priority"
            defaultValue="3"
            disabled={pending}
            className={fieldClass}
          >
            <option value="1">1 · Highest</option>
            <option value="2">2 · High</option>
            <option value="3">3 · Normal</option>
            <option value="4">4 · Later</option>
            <option value="5">5 · Someday</option>
          </select>
          <FieldError id="goal-priority-error" errors={state.fieldErrors?.priority} />
        </div>
      </div>

      <div>
        <label htmlFor="goal-note" className="mb-2 block text-sm font-medium">
          Why this matters{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="goal-note"
          name="note"
          rows={3}
          maxLength={2000}
          disabled={pending}
          placeholder="A short reminder for both of you…"
          className="w-full resize-y rounded-xl border bg-background px-3 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-55"
        />
      </div>

      <FormStatus state={state} />
      <button
        type="submit"
        disabled={pending}
        className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
      >
        <Target aria-hidden="true" className="size-4" />
        {pending ? "Creating goal…" : "Create savings goal"}
      </button>
    </form>
  );
}
