import type { Metadata } from "next";
import {
  BarChart3,
  BookCheck,
  CalendarRange,
  CircleDollarSign,
  PiggyBank,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { redirect } from "next/navigation";

import { getReportsPageData } from "@/lib/finance/data";
import { formatMonth } from "@/lib/formatting/date";
import { formatMoney } from "@/lib/formatting/money";

export const metadata: Metadata = { title: "Reports" };

function monthLabel(month: string) {
  return formatMonth(new Date(`${month}-01T12:00:00Z`));
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[]; year?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedMonth = typeof params.month === "string" ? params.month : undefined;
  const requestedYear = typeof params.year === "string" ? params.year : undefined;
  const data = await getReportsPageData(requestedMonth, requestedYear);
  if (!data) redirect("/login");
  const summary = data.selectedSummary;
  const planRows = [
    {
      label: "Essentials",
      actual: summary.essentials,
      planned: summary.plannedEssentials,
      expense: true,
    },
    {
      label: "Personal",
      actual: summary.personal,
      planned: summary.plannedPersonal,
      expense: true,
    },
    {
      label: "Savings",
      actual: summary.savings,
      planned: summary.plannedSavings,
      expense: false,
    },
    {
      label: "Investments",
      actual: summary.investments,
      planned: summary.plannedInvestments,
      expense: false,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="reveal relative overflow-hidden rounded-[1.6rem] border bg-primary px-6 py-8 text-primary-foreground shadow-[0_24px_60px_hsl(var(--primary)/0.18)] sm:px-9 sm:py-10">
        <div
          className="paper-grid absolute inset-0 opacity-[0.07]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/75">
              <BookCheck aria-hidden="true" className="size-3.5" /> Phase 2B ·
              Reconciliation
            </div>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Close the loop each month.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/72 sm:text-base">
              Plan, actual income, consumptive spending, explicit savings, and explicit
              investments reconciled from their source records.
            </p>
          </div>
          <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              Selected summary
            </p>
            <p className="mt-2 font-display text-2xl font-semibold">
              {monthLabel(summary.month)}
            </p>
            <p className="mt-1 text-xs text-white/60">
              {summary.planVersion
                ? `Plan version ${summary.planVersion}`
                : "No active plan for this month"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.35rem] border bg-card p-4 sm:p-5">
        <form
          method="get"
          className="grid gap-3 sm:grid-cols-[1fr_0.7fr_auto] sm:items-end"
        >
          <div>
            <label htmlFor="report-month" className="mb-2 block text-sm font-medium">
              Monthly summary
            </label>
            <input
              id="report-month"
              type="month"
              name="month"
              defaultValue={data.selectedMonth}
              className="h-12 w-full rounded-xl border bg-background px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div>
            <label htmlFor="report-year" className="mb-2 block text-sm font-medium">
              Annual foundation
            </label>
            <input
              id="report-year"
              type="number"
              name="year"
              min="2000"
              max="2100"
              defaultValue={data.selectedYear}
              className="h-12 w-full rounded-xl border bg-background px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <button
            type="submit"
            className="min-h-12 cursor-pointer rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Update report
          </button>
        </form>
      </section>

      {data.missingRateCurrencies.length > 0 ? (
        <section className="rounded-[1.3rem] border border-amber-500/25 bg-amber-500/[0.07] p-4 text-sm text-amber-900 dark:text-amber-200">
          DZD totals exclude entries missing current manual rates for{" "}
          {data.missingRateCurrencies.join(", ")}.
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Income", value: summary.income, icon: CircleDollarSign },
          { label: "Spending", value: summary.expenses, icon: ReceiptText },
          { label: "Saved", value: summary.savings, icon: PiggyBank },
          { label: "Invested", value: summary.investments, icon: TrendingUp },
          { label: "Remaining cash", value: summary.remaining, icon: Wallet },
        ].map(({ icon: Icon, label, value }) => (
          <article
            key={label}
            className="surface-shadow rounded-[1.25rem] border bg-card p-5"
          >
            <Icon aria-hidden="true" className="size-4.5 text-primary" />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 font-display text-xl font-semibold tabular-nums">
              {formatMoney(value, { maximumFractionDigits: 2 })}
            </p>
          </article>
        ))}
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.4rem] border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">Plan vs actual</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Planned amounts use actual family income for this month
              </p>
            </div>
            <BarChart3 aria-hidden="true" className="size-5 text-muted-foreground" />
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-start text-sm">
              <thead className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                <tr className="border-b">
                  <th className="pb-3 text-start font-semibold">Category</th>
                  <th className="pb-3 text-end font-semibold">Planned</th>
                  <th className="pb-3 text-end font-semibold">Actual</th>
                  <th className="pb-3 text-end font-semibold">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {planRows.map((row) => {
                  const variance =
                    row.planned === null ? null : row.actual - row.planned;
                  const positive =
                    variance !== null && (row.expense ? variance <= 0 : variance >= 0);
                  return (
                    <tr key={row.label}>
                      <td className="py-4 font-semibold">{row.label}</td>
                      <td className="py-4 text-end tabular-nums text-muted-foreground">
                        {row.planned === null ? "No plan" : formatMoney(row.planned)}
                      </td>
                      <td className="py-4 text-end font-semibold tabular-nums">
                        {formatMoney(row.actual)}
                      </td>
                      <td
                        className={`py-4 text-end font-semibold tabular-nums ${variance === null ? "text-muted-foreground" : positive ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}
                      >
                        {variance === null
                          ? "—"
                          : `${variance > 0 ? "+" : ""}${formatMoney(variance)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-[1.4rem] border bg-card p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            Reconciliation proof
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold">
            Every actual has a source
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              ["Income entries", summary.sourceCounts.income],
              ["Expense entries", summary.sourceCounts.expenses],
              ["Savings events", summary.sourceCounts.savings],
              ["Investment events", summary.sourceCounts.investments],
            ].map(([label, count]) => (
              <div key={String(label)} className="rounded-2xl bg-muted/50 p-4">
                <p className="font-display text-2xl font-semibold tabular-nums">
                  {count}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-dashed p-4">
            <p className="text-xs text-muted-foreground">Saving & investment rate</p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
              {summary.savingRate.toFixed(1)}%
            </p>
          </div>
        </aside>
      </section>

      <section className="rounded-[1.4rem] border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              Annual report foundation
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold">
              {data.selectedYear} month ledger
            </h2>
          </div>
          <CalendarRange aria-hidden="true" className="size-5 text-muted-foreground" />
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[58rem] text-sm">
            <thead className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
              <tr className="border-b">
                {[
                  "Month",
                  "Income",
                  "Spending",
                  "Savings",
                  "Investments",
                  "Remaining",
                  "Net worth",
                ].map((label) => (
                  <th
                    key={label}
                    className={`pb-3 font-semibold ${label === "Month" ? "text-start" : "text-end"}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.months.map((row) => (
                <tr
                  key={row.month}
                  className={row.month === summary.month ? "bg-primary/[0.035]" : ""}
                >
                  <td className="py-3 font-semibold">{monthLabel(row.month)}</td>
                  {[
                    row.income,
                    row.expenses,
                    row.savings,
                    row.investments,
                    row.remaining,
                  ].map((value, index) => (
                    <td key={index} className="py-3 text-end tabular-nums">
                      {formatMoney(value)}
                    </td>
                  ))}
                  <td className="py-3 text-end tabular-nums">
                    {row.netWorth === null ? "—" : formatMoney(row.netWorth)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-semibold">
                <td className="pt-4">Year total</td>
                {[
                  data.annualTotals.income,
                  data.annualTotals.expenses,
                  data.annualTotals.savings,
                  data.annualTotals.investments,
                  data.annualTotals.remaining,
                ].map((value, index) => (
                  <td key={index} className="pt-4 text-end tabular-nums">
                    {formatMoney(value)}
                  </td>
                ))}
                <td className="pt-4 text-end text-muted-foreground">Snapshots</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
