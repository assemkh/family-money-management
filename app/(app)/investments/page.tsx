import type { Metadata } from "next";
import { CalendarDays, LineChart, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";

import { InvestmentEventForm } from "@/components/finance/investment-event-form";
import { MoneyTotals } from "@/components/finance/money-totals";
import { PortfolioEntryForm } from "@/components/finance/portfolio-entry-form";
import { calculateGain } from "@/lib/finance/calculations";
import { getInvestmentPageData } from "@/lib/finance/data";
import { formatShortDate } from "@/lib/formatting/date";
import { formatMoney } from "@/lib/formatting/money";

export const metadata: Metadata = { title: "Investments" };

export default async function InvestmentsPage() {
  const data = await getInvestmentPageData();
  if (!data) redirect("/login");

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-[1.6rem] border bg-primary px-6 py-7 text-primary-foreground shadow-[0_24px_60px_hsl(var(--primary)/0.16)] sm:px-9 sm:py-9">
        <div
          className="paper-grid absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/75">
              <LineChart aria-hidden="true" className="size-3.5" />
              Phase 2B · Actual investments
            </div>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Separate the position from the action.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/72 sm:text-base">
              Positions show what you own. Investment events show what you actually
              contributed this month.
            </p>
          </div>
          <div className="min-w-64 rounded-2xl border border-white/12 bg-white/[0.07] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              Invested this month
            </p>
            <div className="mt-3 [&_span]:border-white/10 [&_span]:bg-white/[0.08]">
              <MoneyTotals
                emptyLabel="No investment events"
                totals={data.monthTotals}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-2">
        <div className="surface-shadow rounded-[1.4rem] border bg-card p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-700 dark:text-amber-300">
            Explicit cash-flow event
          </p>
          <h2 className="mb-6 mt-2 font-display text-2xl font-semibold">
            Add to an investment
          </h2>
          <InvestmentEventForm
            defaultDate={data.defaultDate}
            investments={data.activeOptions}
          />
        </div>

        <div className="rounded-[1.4rem] border bg-card p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            Position setup
          </p>
          <h2 className="mb-6 mt-2 font-display text-2xl font-semibold">
            Add an existing holding
          </h2>
          <PortfolioEntryForm kind="investment" defaultDate={data.defaultDate} />
        </div>
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.4rem] border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">Current positions</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manual current values and transparent gain/loss
              </p>
            </div>
            <TrendingUp aria-hidden="true" className="size-5 text-muted-foreground" />
          </div>
          {data.items.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Add a position before recording new investment events.
            </div>
          ) : (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {data.items.map((item) => {
                const result = calculateGain(item.currentValue, item.purchaseValue);
                return (
                  <li key={item.id} className="rounded-2xl bg-muted/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{item.name}</p>
                        <p className="mt-1 text-xs capitalize text-muted-foreground">
                          {item.type.replaceAll("_", " ")}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${result.gain >= 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-destructive/10 text-destructive"}`}
                      >
                        {result.gain >= 0 ? "+" : ""}
                        {formatMoney(result.gain, {
                          currency: item.currency,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <p className="mt-5 font-display text-xl font-semibold">
                      {formatMoney(item.currentValue, {
                        currency: item.currency,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cost{" "}
                      {formatMoney(item.purchaseValue, { currency: item.currency })}
                      {result.returnPercentage === null
                        ? ""
                        : ` · ${result.returnPercentage.toFixed(1)}%`}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-[1.4rem] border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold">Investment history</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Events used by monthly actuals
              </p>
            </div>
            <CalendarDays aria-hidden="true" className="size-5 text-muted-foreground" />
          </div>
          {data.recent.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed bg-muted/25 px-5 py-10 text-center text-sm text-muted-foreground">
              No explicit investment events yet.
            </p>
          ) : (
            <ul className="mt-5 divide-y">
              {data.recent.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {entry.investmentName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatShortDate(entry.transactionDate)} · {entry.memberName}
                    </p>
                    {entry.note ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {entry.note}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-amber-700 dark:text-amber-300">
                    +
                    {formatMoney(entry.amount, {
                      currency: entry.currency,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
