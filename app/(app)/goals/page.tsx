import type { Metadata } from "next";
import {
  CalendarClock,
  CheckCircle2,
  Flag,
  Goal,
  History,
  PiggyBank,
  Sparkles,
  Target,
} from "lucide-react";
import { redirect } from "next/navigation";

import { MoneyTotals } from "@/components/finance/money-totals";
import { SavingContributionForm } from "@/components/finance/saving-contribution-form";
import { SavingsGoalForm } from "@/components/finance/savings-goal-form";
import { SavingsGoalStatusButton } from "@/components/finance/savings-goal-status-button";
import { formatShortDate } from "@/lib/formatting/date";
import { formatMoney } from "@/lib/formatting/money";
import { getSavingsGoalsPageData, type SavingsGoal } from "@/lib/finance/data";

export const metadata: Metadata = { title: "Savings goals" };

const statusStyles: Record<SavingsGoal["status"], string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  paused: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  completed: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  cancelled: "bg-muted text-muted-foreground",
};

function GoalCard({ goal }: { goal: SavingsGoal }) {
  return (
    <article className="group relative overflow-hidden rounded-[1.4rem] border bg-card p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_hsl(var(--primary)/0.08)] sm:p-6">
      <div
        aria-hidden="true"
        className="absolute -end-8 -top-8 size-28 rounded-full border border-emerald-500/10 bg-emerald-500/[0.035] transition group-hover:scale-110"
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              {goal.status === "completed" ? (
                <CheckCircle2 aria-hidden="true" className="size-5" />
              ) : (
                <Target aria-hidden="true" className="size-5" />
              )}
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-semibold tracking-[-0.025em]">
                {goal.name}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] ${statusStyles[goal.status]}`}
                >
                  {goal.status}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Flag aria-hidden="true" className="size-3" /> Priority{" "}
                  {goal.priority}
                </span>
              </div>
            </div>
          </div>
          <p className="shrink-0 font-display text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
            {Math.round(goal.progressPercent)}%
          </p>
        </div>

        <div className="mt-6">
          <div
            className="h-2.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={`${goal.name} savings progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(goal.progressPercent)}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400 transition-[width] duration-700 dark:from-emerald-500 dark:to-emerald-300"
              style={{ width: `${goal.progressPercent}%` }}
            />
          </div>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Saved</p>
              <p className="mt-1 font-semibold tabular-nums">
                {formatMoney(goal.currentAmount, {
                  currency: goal.currency,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="text-end">
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="mt-1 font-semibold tabular-nums">
                {formatMoney(goal.targetAmount, {
                  currency: goal.currency,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-muted/45 p-3.5 text-xs">
          <div>
            <p className="text-muted-foreground">Still needed</p>
            <p className="mt-1 font-semibold tabular-nums">
              {formatMoney(goal.remainingAmount, {
                currency: goal.currency,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Target date</p>
            <p className="mt-1 font-semibold">
              {goal.targetDate ? formatShortDate(goal.targetDate) : "Flexible"}
            </p>
          </div>
        </div>

        {goal.note ? (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {goal.note}
          </p>
        ) : null}

        <div className="mt-5 border-t pt-4">
          <SavingsGoalStatusButton goalId={goal.id} status={goal.status} />
        </div>
      </div>
    </article>
  );
}

export default async function SavingsGoalsPage() {
  const data = await getSavingsGoalsPageData();
  if (!data) redirect("/login");

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="reveal relative overflow-hidden rounded-[1.6rem] border bg-[hsl(154_46%_18%)] px-6 py-7 text-white shadow-[0_24px_60px_hsl(154_46%_18%/0.2)] sm:px-9 sm:py-9">
        <div
          className="paper-grid absolute inset-0 opacity-[0.07]"
          aria-hidden="true"
        />
        <div
          className="absolute -end-10 -top-24 size-72 rounded-full border border-white/10 bg-white/[0.035]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/75">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Phase 2B · Savings engine
            </div>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Turn shared plans into milestones.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/72 sm:text-base">
              Every contribution is a real savings event. Goal progress moves with it,
              while spending and account transfers stay separate.
            </p>
          </div>
          <div className="grid min-w-64 gap-3 rounded-2xl border border-white/12 bg-white/[0.07] p-4 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                Saved this month
              </p>
              <div className="mt-2 [&_span]:border-white/10 [&_span]:bg-white/[0.08]">
                <MoneyTotals emptyLabel="No savings yet" totals={data.monthTotals} />
              </div>
            </div>
            <p className="text-xs leading-5 text-white/60">
              {data.activeGoals.length} active{" "}
              {data.activeGoals.length === 1 ? "goal" : "goals"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-2">
        <div
          id="saving-entry"
          className="surface-shadow scroll-mt-28 rounded-[1.4rem] border bg-card p-5 sm:p-7"
        >
          <div className="mb-6 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <PiggyBank aria-hidden="true" className="size-4.5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">
                Explicit savings record
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.035em]">
                Record money saved
              </h2>
            </div>
          </div>
          <SavingContributionForm
            defaultDate={data.defaultDate}
            goals={data.activeGoals}
          />
        </div>

        <div className="rounded-[1.4rem] border bg-card p-5 sm:p-7">
          <div className="mb-6 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/[0.08] text-primary">
              <Goal aria-hidden="true" className="size-4.5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                New milestone
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.035em]">
                Create a family goal
              </h2>
            </div>
          </div>
          <SavingsGoalForm />
        </div>
      </section>

      <section aria-labelledby="goal-progress-heading">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2
              id="goal-progress-heading"
              className="font-display text-2xl font-semibold tracking-[-0.03em] sm:text-3xl"
            >
              Your milestone trail
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Highest priorities appear first. Completed goals keep their history.
            </p>
          </div>
          <div className="rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            Goal balances:{" "}
            <MoneyTotals emptyLabel="0 DA" totals={data.goalProgressTotals} />
          </div>
        </div>

        {data.goals.length === 0 ? (
          <div className="rounded-[1.4rem] border border-dashed bg-card/60 px-6 py-16 text-center">
            <Target
              aria-hidden="true"
              className="mx-auto size-8 text-muted-foreground"
            />
            <p className="mt-4 font-display text-xl font-semibold">
              No milestones yet.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Create the first goal above, then record a contribution toward it.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[1.4rem] border bg-card p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-[-0.025em]">
              Savings history
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The explicit records used by monthly actuals
            </p>
          </div>
          <History aria-hidden="true" className="size-5 text-muted-foreground" />
        </div>

        {data.recent.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed bg-muted/25 px-5 py-10 text-center text-sm text-muted-foreground">
            Your first recorded savings event will appear here.
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
                    {entry.goalName ?? "General savings"}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock aria-hidden="true" className="size-3" />
                    {formatShortDate(entry.transactionDate)} · {entry.memberName}
                  </p>
                  {entry.note ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {entry.note}
                    </p>
                  ) : null}
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
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
      </section>
    </div>
  );
}
