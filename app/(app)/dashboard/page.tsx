import type { Metadata } from "next";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CalendarRange,
  ChartNoAxesCombined,
  CircleDollarSign,
  Landmark,
  PiggyBank,
  ReceiptText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  DashboardDonut,
  DashboardNetWorthTrend,
  DashboardPlanActual,
  DashboardTrendChart,
} from "@/components/finance/dashboard-charts";
import { formatMonth } from "@/lib/formatting/date";
import { formatMoney } from "@/lib/formatting/money";
import {
  getDashboardPageData,
  type DashboardHealthIndicator,
} from "@/lib/finance/data";

export const metadata: Metadata = { title: "Dashboard" };

function monthLabel(month: string) {
  return formatMonth(new Date(`${month}-01T12:00:00Z`));
}

function KpiCard({
  caption,
  icon: Icon,
  label,
  tone,
  value,
}: {
  caption: string;
  icon: LucideIcon;
  label: string;
  tone: string;
  value: string;
}) {
  return (
    <article className="surface-shadow group rounded-[1.25rem] border bg-card p-4 transition duration-300 hover:-translate-y-0.5 hover:border-primary/25 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          DZD
        </span>
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold tracking-[-0.035em] tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{caption}</p>
    </article>
  );
}

const healthStyles: Record<DashboardHealthIndicator["status"], string> = {
  positive:
    "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-800 dark:text-emerald-200",
  warning: "border-amber-500/20 bg-amber-500/[0.07] text-amber-900 dark:text-amber-200",
  negative: "border-rose-500/20 bg-rose-500/[0.07] text-rose-800 dark:text-rose-200",
  neutral: "border-border bg-muted/45 text-foreground",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedMonth = typeof params.month === "string" ? params.month : undefined;
  const data = await getDashboardPageData(requestedMonth);
  if (!data) redirect("/login");
  const combinedProgress = data.savings + data.investments;
  const assetTotal = data.assetAllocation.reduce(
    (total, item) => total + item.amount,
    0,
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="reveal relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[hsl(164_28%_12%)] px-5 py-6 text-white shadow-[0_28px_80px_hsl(164_30%_10%/0.24)] sm:px-8 sm:py-8 xl:px-10">
        <div
          className="paper-grid absolute inset-0 opacity-[0.045]"
          aria-hidden="true"
        />
        <div
          className="absolute -end-28 -top-40 size-[28rem] rounded-full border border-white/10 bg-[radial-gradient(circle,hsl(39_55%_75%/0.16),transparent_62%)]"
          aria-hidden="true"
        />
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/70">
              <Sparkles aria-hidden="true" className="size-3.5 text-amber-200" />
              Phase 3A · Family financial brief
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-white/48">
              Money left after every recorded commitment
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-x-5 gap-y-2">
              <h1
                className={`font-display text-[2.7rem] font-semibold leading-none tracking-[-0.055em] tabular-nums sm:text-6xl ${data.remaining >= 0 ? "text-white" : "text-rose-200"}`}
              >
                {formatMoney(data.remaining, { maximumFractionDigits: 2 })}
              </h1>
              <span
                className={`mb-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${data.remaining >= 0 ? "bg-emerald-300/12 text-emerald-200" : "bg-rose-300/12 text-rose-200"}`}
              >
                {data.remaining >= 0 ? (
                  <ArrowUp aria-hidden="true" className="size-3.5" />
                ) : (
                  <ArrowDown aria-hidden="true" className="size-3.5" />
                )}
                {data.remaining >= 0 ? "Positive flow" : "Outflow above income"}
              </span>
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/62 sm:text-base">
              {data.selectedRecordCount > 0
                ? `${monthLabel(data.month)} is reconciled from ${data.selectedRecordCount} income, expense, saving, and investment records.`
                : `${monthLabel(data.month)} has no recorded activity yet. Use the quick links below to begin the month.`}
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-white/12 bg-white/[0.06] p-4 backdrop-blur-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`/dashboard?month=${data.previousMonth}`}
                aria-label={`Open ${monthLabel(data.previousMonth)}`}
                className="grid size-10 cursor-pointer place-items-center rounded-xl border border-white/12 text-white/65 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
              </Link>
              <div className="text-center">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/45">
                  Reporting month
                </p>
                <p className="mt-1 font-display text-xl font-semibold">
                  {monthLabel(data.month)}
                </p>
              </div>
              <Link
                href={`/dashboard?month=${data.nextMonth}`}
                aria-label={`Open ${monthLabel(data.nextMonth)}`}
                className="grid size-10 cursor-pointer place-items-center rounded-xl border border-white/12 text-white/65 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" />
              </Link>
            </div>
            <form method="get" className="mt-4 flex gap-2">
              <label htmlFor="dashboard-month" className="sr-only">
                Choose dashboard month
              </label>
              <input
                id="dashboard-month"
                name="month"
                type="month"
                defaultValue={data.month}
                autoComplete="off"
                required
                className="h-11 min-w-0 flex-1 rounded-xl border border-white/12 bg-black/10 px-3 text-sm font-semibold text-white [color-scheme:dark]"
              />
              <button
                type="submit"
                className="min-h-11 cursor-pointer rounded-xl bg-[hsl(39_55%_78%)] px-4 text-xs font-semibold text-[hsl(164_28%_12%)] transition hover:bg-[hsl(39_60%_84%)]"
              >
                View
              </button>
            </form>
          </div>
        </div>
      </section>

      {data.missingRateCurrencies.length > 0 ? (
        <section className="flex items-start gap-3 rounded-[1.2rem] border border-amber-500/25 bg-amber-500/[0.07] p-4 text-amber-900 dark:text-amber-200">
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Some DZD values are incomplete</p>
            <p className="mt-1 text-xs leading-5">
              Add current manual rates for {data.missingRateCurrencies.join(", ")} on
              Accounts. Known DZD values remain visible; missing foreign amounts are not
              guessed.
            </p>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="dashboard-kpis-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              Monthly ledger
            </p>
            <h2
              id="dashboard-kpis-heading"
              className="mt-1 font-display text-2xl font-semibold tracking-[-0.035em]"
            >
              Six numbers tell the story
            </h2>
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Source-driven · manual rates only
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Income"
            value={formatMoney(data.income, {
              compact: true,
              maximumFractionDigits: 1,
            })}
            caption="Actual income entries"
            icon={CircleDollarSign}
            tone="bg-sky-500/10 text-sky-700 dark:text-sky-300"
          />
          <KpiCard
            label="Spending"
            value={formatMoney(data.spending, {
              compact: true,
              maximumFractionDigits: 1,
            })}
            caption="Consumption expenses"
            icon={ReceiptText}
            tone="bg-rose-500/10 text-rose-700 dark:text-rose-300"
          />
          <KpiCard
            label="Saved"
            value={formatMoney(data.savings, {
              compact: true,
              maximumFractionDigits: 1,
            })}
            caption="Explicit saving events"
            icon={PiggyBank}
            tone="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          />
          <KpiCard
            label="Invested"
            value={formatMoney(data.investments, {
              compact: true,
              maximumFractionDigits: 1,
            })}
            caption="Explicit investment events"
            icon={TrendingUp}
            tone="bg-amber-500/10 text-amber-700 dark:text-amber-300"
          />
          <KpiCard
            label="Progress"
            value={formatMoney(combinedProgress, {
              compact: true,
              maximumFractionDigits: 1,
            })}
            caption={`${data.savingRate.toFixed(1)}% of actual income`}
            icon={Target}
            tone="bg-violet-500/10 text-violet-700 dark:text-violet-300"
          />
          <KpiCard
            label="Net worth"
            value={
              data.netWorth === null
                ? "No snapshot"
                : formatMoney(data.netWorth, {
                    compact: true,
                    maximumFractionDigits: 1,
                  })
            }
            caption={data.netWorthSource ?? "Capture this month to track it"}
            icon={Landmark}
            tone="bg-slate-500/10 text-slate-700 dark:text-slate-300"
          />
        </div>
      </section>

      {data.selectedRecordCount === 0 ? (
        <section className="rounded-[1.4rem] border border-dashed bg-card px-5 py-10 text-center sm:px-8">
          <CalendarRange
            aria-hidden="true"
            className="mx-auto size-8 text-muted-foreground"
          />
          <h2 className="mt-4 font-display text-2xl font-semibold">
            Start {monthLabel(data.month)}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Add income first, then record daily expenses and explicit progress toward
            savings or investments. This dashboard will rebuild itself from those
            sources.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {[
              ["Add income", "/income"],
              ["Add expense", "/expenses#expense-entry"],
              ["Record saving", "/goals"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="inline-flex min-h-10 items-center rounded-xl border bg-background px-4 text-xs font-semibold transition hover:border-primary/30 hover:text-primary"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-12">
        <article className="rounded-[1.4rem] border bg-card p-5 sm:p-6 xl:col-span-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                Rhythm
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                Six-month money flow
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Actual entries valued with current manual exchange rates
              </p>
            </div>
            <ChartNoAxesCombined
              aria-hidden="true"
              className="size-5 text-muted-foreground"
            />
          </div>
          <DashboardTrendChart points={data.trends} />
        </article>

        <aside className="rounded-[1.4rem] border bg-card p-5 sm:p-6 xl:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            Financial health
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Current signals</h2>
          <div className="mt-6 space-y-3">
            {data.health.map((indicator) => (
              <div
                key={indicator.label}
                className={`rounded-2xl border p-4 ${healthStyles[indicator.status]}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] opacity-70">
                    {indicator.label}
                  </p>
                  {indicator.status === "positive" ? (
                    <ShieldCheck aria-hidden="true" className="size-4" />
                  ) : null}
                </div>
                <p className="mt-2 font-display text-xl font-semibold">
                  {indicator.value}
                </p>
                <p className="mt-1 text-xs leading-5 opacity-70">
                  {indicator.description}
                </p>
              </div>
            ))}
          </div>
        </aside>

        <article className="rounded-[1.4rem] border bg-card p-5 sm:p-6 xl:col-span-5">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                Intention vs reality
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                Plan vs actual
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.planVersion
                  ? `Active plan version ${data.planVersion}`
                  : "No active monthly plan"}
              </p>
            </div>
            <Link
              href={`/monthly-plan?month=${data.month}`}
              className="grid size-10 place-items-center rounded-xl border transition hover:border-primary/30 hover:text-primary"
              aria-label="Open monthly plan"
            >
              <ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" />
            </Link>
          </div>
          <DashboardPlanActual rows={data.planRows} />
        </article>

        <article className="rounded-[1.4rem] border bg-card p-5 sm:p-6 xl:col-span-7">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              Consumption map
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              Expense breakdown
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Savings and investments remain excluded from spending
            </p>
          </div>
          <DashboardDonut
            items={data.expenseBreakdown}
            total={data.spending}
            totalLabel="Spent"
          />
        </article>

        <article className="rounded-[1.4rem] border bg-card p-5 sm:p-6 xl:col-span-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                Current position
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                Asset allocation
              </h2>
            </div>
            <Wallet aria-hidden="true" className="size-5 text-muted-foreground" />
          </div>
          <DashboardDonut
            items={data.assetAllocation}
            total={assetTotal}
            totalLabel="Assets"
          />
          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-dashed p-4 text-sm">
            <span className="text-muted-foreground">Outstanding liabilities</span>
            <span className="font-semibold tabular-nums">
              {formatMoney(data.liabilitiesValue, { maximumFractionDigits: 2 })}
            </span>
          </div>
        </article>

        <article className="rounded-[1.4rem] border bg-card p-5 sm:p-6 xl:col-span-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                Long view
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                Net-worth trend
              </h2>
            </div>
            <Link
              href="/net-worth"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Manage snapshots
            </Link>
          </div>
          <DashboardNetWorthTrend points={data.trends} />
        </article>
      </section>

      <section className="rounded-[1.5rem] border bg-[hsl(39_35%_89%)] p-5 text-[hsl(164_25%_16%)] dark:bg-[hsl(164_18%_16%)] dark:text-foreground sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] opacity-55">
              Shared milestones
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em]">
              Goals turn surplus into direction.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 opacity-65">
              Progress is updated only by explicit saving records, never by planned
              percentages.
            </p>
            <Link
              href="/goals"
              className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[hsl(164_25%_16%)] px-4 text-xs font-semibold text-white dark:bg-primary dark:text-primary-foreground"
            >
              Open savings goals{" "}
              <ArrowRight aria-hidden="true" className="size-3.5 rtl:rotate-180" />
            </Link>
          </div>
          {data.goals.length === 0 ? (
            <div className="grid min-h-44 place-items-center rounded-2xl border border-current/15 bg-white/20 px-5 text-center dark:bg-white/[0.03]">
              <div>
                <Target aria-hidden="true" className="mx-auto size-6 opacity-45" />
                <p className="mt-3 font-medium">No active goal yet.</p>
                <p className="mt-1 text-sm opacity-60">
                  Create one to chart shared progress.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.goals.map((goal) => (
                <article
                  key={goal.id}
                  className="rounded-2xl border border-current/10 bg-white/28 p-4 dark:bg-white/[0.035]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{goal.name}</p>
                      <p className="mt-1 text-xs opacity-60">
                        {formatMoney(goal.currentAmount, {
                          currency: goal.currency,
                          compact: true,
                        })}{" "}
                        of{" "}
                        {formatMoney(goal.targetAmount, {
                          currency: goal.currency,
                          compact: true,
                        })}
                      </p>
                    </div>
                    <span className="font-display text-xl font-semibold tabular-nums">
                      {Math.round(goal.progressPercent)}%
                    </span>
                  </div>
                  <div
                    className="mt-4 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
                    role="progressbar"
                    aria-label={`${goal.name} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(goal.progressPercent)}
                  >
                    <div
                      className="h-full rounded-full bg-[hsl(164_40%_30%)] dark:bg-emerald-400"
                      style={{ width: `${goal.progressPercent}%` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
