import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock3, ReceiptText, Tags } from "lucide-react";

import { ExpenseEntryForm } from "@/components/finance/expense-entry-form";
import { MoneyTotals } from "@/components/finance/money-totals";
import { formatShortDate } from "@/lib/formatting/date";
import { formatMoney } from "@/lib/formatting/money";
import { getExpensePageData } from "@/lib/finance/data";

export const metadata: Metadata = { title: "Expenses" };

export default async function ExpensesPage() {
  const data = await getExpensePageData();
  if (!data) redirect("/login");

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="reveal relative overflow-hidden rounded-[1.6rem] border bg-[hsl(var(--sidebar))] px-6 py-7 text-white shadow-[0_24px_60px_rgba(15,23,42,0.16)] sm:px-9 sm:py-9">
        <div
          className="paper-grid absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/70">
              <ReceiptText aria-hidden="true" className="size-3.5" />
              Daily quick add
            </div>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Capture an expense fast.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
              Today and your identity are already set. Enter the amount, choose a
              category, and save.
            </p>
          </div>
          <div className="min-w-64 rounded-2xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
              Spent this month
            </p>
            <div className="mt-3 [&_span]:border-white/10 [&_span]:bg-white/[0.08]">
              <MoneyTotals emptyLabel="No expenses yet" totals={data.totals} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div
          id="expense-entry"
          className="surface-shadow scroll-mt-28 rounded-[1.4rem] border bg-card p-5 sm:p-7"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                New entry
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.035em]">
                Add daily expense
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The category stays selected after saving so repeated entries take fewer
                taps.
              </p>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent sm:flex">
              <Clock3 aria-hidden="true" className="size-3.5" />
              Under 10 sec
            </span>
          </div>
          <ExpenseEntryForm
            accounts={data.accounts}
            categories={data.categories}
            currentMemberName={data.currentMemberName}
            defaultDate={data.defaultDate}
          />
        </div>

        <section className="rounded-[1.4rem] border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-[-0.025em]">
                Recent expenses
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The latest 12 household entries
              </p>
            </div>
            <Tags aria-hidden="true" className="size-5 text-muted-foreground" />
          </div>

          {data.recent.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed bg-muted/25 px-5 py-10 text-center">
              <p className="font-medium">No expenses have been entered yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your first saved expense will appear here.
              </p>
            </div>
          ) : (
            <ul className="mt-5 divide-y">
              {data.recent.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {entry.categoryName}
                      </p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-semibold capitalize text-muted-foreground">
                        {entry.categoryType}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.memberName} · {formatShortDate(entry.transactionDate)}
                      {entry.accountName ? ` · ${entry.accountName}` : ""}
                    </p>
                    {entry.note ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {entry.note}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    −
                    {formatMoney(entry.amount, {
                      currency: entry.currency,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </div>
  );
}
