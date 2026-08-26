import type { Metadata } from "next";
import {
  BarChart3,
  BookCheck,
  CalendarRange,
  CircleDollarSign,
  Download,
  Filter,
  PiggyBank,
  ReceiptText,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";
import { redirect } from "next/navigation";

import { getReportsPageData } from "@/lib/finance/read-models/reports/page";
import { formatMonth, formatShortDate } from "@/lib/formatting/date";
import { formatMoney } from "@/lib/formatting/money";

export const metadata: Metadata = { title: "Reports" };

function monthLabel(month: string) {
  return formatMonth(new Date(`${month}-01T12:00:00Z`));
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string | string[];
    year?: string | string[];
    period?: string | string[];
    activityType?: string | string[];
    memberId?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const requestedMonth = typeof params.month === "string" ? params.month : undefined;
  const requestedYear = typeof params.year === "string" ? params.year : undefined;
  const data = await getReportsPageData(requestedMonth, requestedYear, {
    period: typeof params.period === "string" ? params.period : undefined,
    activityType:
      typeof params.activityType === "string" ? params.activityType : undefined,
    memberId: typeof params.memberId === "string" ? params.memberId : undefined,
  });
  if (!data) redirect("/login");
  const summary = data.selectedSummary;
  const exportParams = new URLSearchParams({
    month: data.selectedMonth,
    year: data.selectedYear,
    period: data.activityFilters.period,
    activityType: data.activityFilters.activityType,
  });
  if (data.activityFilters.memberId) {
    exportParams.set("memberId", data.activityFilters.memberId);
  }
  const activityTone = {
    income: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    expense: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    saving: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    investment: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  } as const;
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
              <BookCheck aria-hidden="true" className="size-3.5" /> Household reporting
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
        <div className="mb-5 flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Filter aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold">Report controls</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Summary controls set the family totals; activity controls filter the
              source ledger and CSV.
            </p>
          </div>
        </div>
        <form
          method="get"
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-6 xl:items-end"
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
              autoComplete="off"
              required
              className="h-12 w-full rounded-xl border bg-background px-3 text-sm font-semibold outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
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
              autoComplete="off"
              inputMode="numeric"
              required
              className="h-12 w-full rounded-xl border bg-background px-3 text-sm font-semibold outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
            />
          </div>
          <div>
            <label htmlFor="report-period" className="mb-2 block text-sm font-medium">
              Ledger period
            </label>
            <select
              id="report-period"
              name="period"
              defaultValue={data.activityFilters.period}
              className="h-12 w-full cursor-pointer rounded-xl border bg-background px-3 text-sm font-semibold outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
            >
              <option value="month">Selected month</option>
              <option value="year">Whole year</option>
            </select>
          </div>
          <div>
            <label htmlFor="report-type" className="mb-2 block text-sm font-medium">
              Record type
            </label>
            <select
              id="report-type"
              name="activityType"
              defaultValue={data.activityFilters.activityType}
              className="h-12 w-full cursor-pointer rounded-xl border bg-background px-3 text-sm font-semibold outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
            >
              <option value="all">All records</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
              <option value="saving">Savings</option>
              <option value="investment">Investments</option>
            </select>
          </div>
          <div>
            <label htmlFor="report-member" className="mb-2 block text-sm font-medium">
              Family member
            </label>
            <select
              id="report-member"
              name="memberId"
              defaultValue={data.activityFilters.memberId ?? ""}
              className="h-12 w-full cursor-pointer rounded-xl border bg-background px-3 text-sm font-semibold outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
            >
              <option value="">All members</option>
              {data.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="min-h-12 cursor-pointer rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Apply filters
          </button>
        </form>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            {data.activityRows.length} matching source{" "}
            {data.activityRows.length === 1 ? "record" : "records"}
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/reports/export?${exportParams.toString()}`}
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <Download aria-hidden="true" className="size-3.5" /> Export filtered CSV
            </a>
            <a
              href={`/reports?month=${data.selectedMonth}&year=${data.selectedYear}`}
              className="inline-flex min-h-10 cursor-pointer items-center rounded-xl border bg-background px-4 text-xs font-semibold transition hover:border-primary/30 hover:text-primary"
            >
              Reset activity filters
            </a>
          </div>
        </div>
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
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              Source ledger
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold">
              Filtered financial activity
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.activityFilters.period === "month"
                ? monthLabel(data.selectedMonth)
                : data.selectedYear}{" "}
              ·{" "}
              {data.activityFilters.activityType === "all"
                ? "all record types"
                : data.activityFilters.activityType}
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <UserRound aria-hidden="true" className="size-3.5" />
            {data.activityFilters.memberId
              ? data.members.find(
                  (member) => member.id === data.activityFilters.memberId,
                )?.name
              : "All family members"}
          </div>
        </div>

        {data.activityRows.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed bg-muted/20 px-5 py-12 text-center">
            <Filter
              aria-hidden="true"
              className="mx-auto size-6 text-muted-foreground"
            />
            <p className="mt-3 font-medium">No source records match these filters.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Widen the period, choose all members, or reset the activity filters.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                <tr className="border-b">
                  <th className="pb-3 text-start font-semibold">Date</th>
                  <th className="pb-3 text-start font-semibold">Record</th>
                  <th className="pb-3 text-start font-semibold">Category</th>
                  <th className="pb-3 text-start font-semibold">Member</th>
                  <th className="pb-3 text-start font-semibold">Note</th>
                  <th className="pb-3 text-end font-semibold">Source amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.activityRows.map((row) => (
                  <tr
                    key={`${row.type}-${row.id}`}
                    className="[content-visibility:auto]"
                  >
                    <td className="whitespace-nowrap py-3 pe-4 font-medium">
                      {formatShortDate(row.date)}
                    </td>
                    <td className="py-3 pe-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${activityTone[row.type]}`}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td className="py-3 pe-4 font-medium">{row.category}</td>
                    <td className="py-3 pe-4 text-muted-foreground">
                      {row.memberName}
                    </td>
                    <td className="max-w-64 truncate py-3 pe-4 text-muted-foreground">
                      {row.note ?? "—"}
                    </td>
                    <td className="whitespace-nowrap py-3 text-end font-semibold tabular-nums">
                      {formatMoney(row.amount, {
                        currency: row.currency,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
