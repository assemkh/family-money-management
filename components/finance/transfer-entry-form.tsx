"use client";

import { ArrowLeftRight } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { createTransferAction } from "@/app/actions/finance";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import type { AccountOption } from "@/lib/finance/data";
import { initialFinanceActionState } from "@/lib/finance/action-state";
import { formatMoney } from "@/lib/formatting/money";

const fieldClass =
  "h-12 w-full rounded-xl border bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-55";

function compatibleDestination(accounts: AccountOption[], sourceId: string) {
  const source = accounts.find((account) => account.id === sourceId);
  return accounts.find(
    (account) => account.id !== sourceId && account.currency === source?.currency,
  );
}

export function TransferEntryForm({
  accounts,
  defaultDate,
}: {
  accounts: AccountOption[];
  defaultDate: string;
}) {
  const initialSource = accounts.find((account) =>
    compatibleDestination(accounts, account.id),
  );
  const [fromAccountId, setFromAccountId] = useState(initialSource?.id ?? "");
  const [toAccountId, setToAccountId] = useState(
    compatibleDestination(accounts, initialSource?.id ?? "")?.id ?? "",
  );
  const [state, action, pending] = useActionState(
    createTransferAction,
    initialFinanceActionState,
  );
  const amountRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const source = accounts.find((account) => account.id === fromAccountId);
  const eligibleDestinations = accounts.filter(
    (account) => account.id !== fromAccountId && account.currency === source?.currency,
  );

  useEffect(() => {
    if (state.status !== "success") return;
    if (amountRef.current) amountRef.current.value = "";
    if (noteRef.current) noteRef.current.value = "";
    amountRef.current?.focus();
  }, [state]);

  const canTransfer = Boolean(source && eligibleDestinations.length > 0);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="transfer-amount" className="mb-2 block text-sm font-semibold">
          Amount
        </label>
        <div className="relative">
          <input
            ref={amountRef}
            id="transfer-amount"
            name="amount"
            type="text"
            inputMode="decimal"
            required
            disabled={pending || !canTransfer}
            aria-invalid={Boolean(state.fieldErrors?.amount)}
            aria-describedby="transfer-amount-help transfer-amount-error"
            placeholder="0.00"
            className="h-16 w-full rounded-2xl border bg-background px-4 pe-20 font-display text-3xl font-semibold tracking-[-0.04em] shadow-sm outline-none transition placeholder:text-muted-foreground/35 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-55"
          />
          <span className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
            {source?.currency ?? "—"}
          </span>
        </div>
        <p id="transfer-amount-help" className="mt-1.5 text-xs text-muted-foreground">
          {source
            ? `Available: ${formatMoney(source.currentBalance, {
                currency: source.currency,
                maximumFractionDigits: 2,
              })}`
            : "Choose a source account."}
        </p>
        <FieldError id="transfer-amount-error" errors={state.fieldErrors?.amount} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="transfer-from" className="mb-2 block text-sm font-medium">
            From account
          </label>
          <select
            id="transfer-from"
            name="fromAccountId"
            value={fromAccountId}
            required
            disabled={pending || accounts.length < 2}
            onChange={(event) => {
              const nextSourceId = event.target.value;
              setFromAccountId(nextSourceId);
              setToAccountId(compatibleDestination(accounts, nextSourceId)?.id ?? "");
            }}
            className={fieldClass}
          >
            {accounts.map((account) => (
              <option
                key={account.id}
                value={account.id}
                disabled={!compatibleDestination(accounts, account.id)}
              >
                {account.name} · {account.currency}
              </option>
            ))}
          </select>
          <FieldError
            id="transfer-from-error"
            errors={state.fieldErrors?.fromAccountId}
          />
        </div>

        <div>
          <label htmlFor="transfer-to" className="mb-2 block text-sm font-medium">
            To account
          </label>
          <select
            id="transfer-to"
            name="toAccountId"
            value={toAccountId}
            required
            disabled={pending || eligibleDestinations.length === 0}
            onChange={(event) => setToAccountId(event.target.value)}
            className={fieldClass}
          >
            {eligibleDestinations.length === 0 ? (
              <option value="">No same-currency destination</option>
            ) : null}
            {eligibleDestinations.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.currency}
              </option>
            ))}
          </select>
          <FieldError id="transfer-to-error" errors={state.fieldErrors?.toAccountId} />
        </div>
      </div>

      <div>
        <label htmlFor="transfer-date" className="mb-2 block text-sm font-medium">
          Date
        </label>
        <input
          id="transfer-date"
          name="transferDate"
          type="date"
          required
          defaultValue={defaultDate}
          disabled={pending || !canTransfer}
          aria-invalid={Boolean(state.fieldErrors?.transferDate)}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="transfer-note" className="mb-2 block text-sm font-medium">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          ref={noteRef}
          id="transfer-note"
          name="note"
          rows={3}
          maxLength={2000}
          disabled={pending || !canTransfer}
          placeholder="Why are you moving this money?"
          className="w-full resize-y rounded-xl border bg-background px-3 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-55"
        />
      </div>

      {!canTransfer ? (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-3.5 py-3 text-sm text-amber-800 dark:text-amber-300">
          Add or activate at least two accounts with the same currency to make a
          transfer.
        </p>
      ) : null}

      <FormStatus state={state} />

      <button
        type="submit"
        disabled={pending || !canTransfer}
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-55"
      >
        <ArrowLeftRight aria-hidden="true" className="size-4" />
        {pending ? "Moving money…" : "Complete transfer"}
      </button>
    </form>
  );
}
