import type { Metadata } from "next";
import {
  ArrowDownToLine,
  ArrowRight,
  ChartNoAxesCombined,
  CircleDollarSign,
  PiggyBank,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MoneyTotals } from "@/components/finance/money-totals";
import { formatMonth } from "@/lib/formatting/date";
import { formatMoney } from "@/lib/formatting/money";
import { getDashboardPageData, type MoneyTotal } from "@/lib/finance/data";

export const metadata: Metadata = { title: "Dashboard" };

function FlowCard({
  description,
  href,
  icon: Icon,
  label,
  tone,
  totals,
}: {
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
  tone: string;
  totals: MoneyTotal[];
}) {
  return (
    <Link
      href={href}
      className="surface-shadow group rounded-[1.35rem] border bg-card p-5 transition duration-300 hover:-translate-y-0.5 hover:border-primary/25 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`grid size-11 place-items-center rounded-2xl ${tone}`}>
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <ArrowRight
          aria-hidden="true"
          className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-1"
        />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2">
        <MoneyTotals emptyLabel="No entries yet" totals={totals} />
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">{description}</p>
    </Link>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardPageData();
  if (!data) redirect("/login");
  const monthLabel = formatMonth(new Date(`${data.month}-01T12:00:00Z`));

  return (
    <div className="space-y-7 sm:space-y-9">
      <section className="reveal relative overflow-hidden rounded-[1.6rem] border bg-primary px-6 py-8 text-primary-foreground shadow-[0_24px_60px_hsl(var(--primary)/0.18)] sm:px-9 sm:py-10 xl:px-12 xl:py-12">
        <div
          className="paper-grid absolute inset-0 opacity-[0.07]"
          aria-hidden="true"
        />
        <div
          className="absolute -end-16 -top-20 size-64 rounded-full border border-white/10 bg-white/[0.04]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/75">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Live family overview
            </div>
            <h1 className="mt-6 max-w-2xl font-display text-[2.5rem] font-semibold leading-[0.98] tracking-[-0.045em] text-balance sm:text-5xl xl:text-[3.6rem]">
              See where this month is going.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
              Income, spending, and savings below come from the entries you recorded—no
              planned percentage is presented as real money.
            </p>
          </div>
          <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              Reporting month
            </p>
            <p className="mt-2 font-display text-2xl font-semibold">{monthLabel}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/60">
              <ShieldCheck aria-hidden="true" className="size-3.5" /> Source-driven
              totals
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="monthly-flow-heading">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2
              id="monthly-flow-heading"
              className="font-display text-2xl font-semibold tracking-[-0.03em] sm:text-3xl"
            >
              Monthly money flow
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each currency stays separate until a current manual exchange rate exists.
            </p>
          </div>
          <Link
            href="/monthly-plan"
            className="inline-flex min-h-10 w-fit items-center gap-2 rounded-xl border bg-card px-3.5 text-xs font-semibold transition hover:border-primary/25 hover:text-primary"
          >
            <ChartNoAxesCombined aria-hidden="true" className="size-3.5" /> Open monthly
            plan
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FlowCard
            label="Income"
            description="Actual income entries for this month."
            href="/income"
            icon={ArrowDownToLine}
            tone="bg-sky-500/10 text-sky-700 dark:text-sky-300"
            totals={data.incomeTotals}
          />
          <FlowCard
            label="Consumption spending"
            description="Expenses only; savings and investments are excluded."
            href="/expenses"
            icon={ReceiptText}
            tone="bg-rose-500/10 text-rose-700 dark:text-rose-300"
            totals={data.spendingTotals}
          />
          <FlowCard
            label="Actual savings"
            description="Explicit savings records—not the planned percentage."
            href="/goals"
            icon={PiggyBank}
            tone="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            totals={data.savingsTotals}
          />
          <FlowCard
            label="Actual investments"
            description="Explicit investment events will appear here."
            href="/investments"
            icon={TrendingUp}
            tone="bg-amber-500/10 text-amber-700 dark:text-amber-300"
            totals={data.investmentTotals}
          />
        </div>
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.4rem] border bg-card p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">
                Shared milestones
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.035em]">
                Savings goals
              </h2>
            </div>
            <Target aria-hidden="true" className="size-5 text-muted-foreground" />
          </div>

          {data.goals.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed bg-muted/25 px-5 py-10 text-center">
              <p className="font-medium">No savings goal yet.</p>
              <Link
                href="/goals"
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground"
              >
                Create your first goal{" "}
                <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {data.goals.map((goal) => (
                <article key={goal.id} className="rounded-2xl bg-muted/45 p-4">
                  <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{goal.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatMoney(goal.currentAmount, {
                          currency: goal.currency,
                          maximumFractionDigits: 2,
                        })}{" "}
                        of {formatMoney(goal.targetAmount, { currency: goal.currency })}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                      {Math.round(goal.progressPercent)}%
                    </p>
                  </div>
                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-background"
                    role="progressbar"
                    aria-label={`${goal.name} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(goal.progressPercent)}
                  >
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${goal.progressPercent}%` }}
                    />
                  </div>
                </article>
              ))}
              <Link
                href="/goals"
                className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-primary hover:underline"
              >
                View all goals <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            </div>
          )}
        </div>

        <aside className="relative overflow-hidden rounded-[1.4rem] border bg-[hsl(39_35%_89%)] p-6 text-[hsl(164_25%_16%)] dark:bg-[hsl(164_18%_16%)] dark:text-foreground sm:p-7">
          <CircleDollarSign
            aria-hidden="true"
            className="absolute end-5 top-5 size-10 opacity-10"
          />
          <div className="flex min-h-64 flex-col justify-end">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] opacity-60">
              Calculation promise
            </p>
            <h2 className="mt-3 max-w-sm font-display text-2xl font-semibold leading-tight tracking-[-0.03em]">
              A plan is an intention. An actual is a record.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 opacity-70">
              Savings only enters this dashboard when you record it. Transfers remain
              movements between accounts and never inflate spending.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
