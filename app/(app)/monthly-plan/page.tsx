import type { Metadata } from "next";
import { CalendarRange, Clock3, History, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { MonthlyPlanForm } from "@/components/finance/monthly-plan-form";
import { MonthlyPlanRevisionDialog } from "@/components/finance/monthly-plan-revision-dialog";
import { MoneyTotals } from "@/components/finance/money-totals";
import { formatMonth } from "@/lib/formatting/date";
import { formatMoney } from "@/lib/formatting/money";
import { getMonthlyPlanPageData } from "@/lib/finance/read-models/planning/monthly-plan";

export const metadata: Metadata = { title: "Monthly plan" };

function monthLabel(month: string) {
  return formatMonth(new Date(`${month}-01T12:00:00Z`));
}

export default async function MonthlyPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedMonth = typeof params.month === "string" ? params.month : undefined;
  const data = await getMonthlyPlanPageData(requestedMonth);
  if (!data) redirect("/login");
  const allocation = data.currentVersion?.allocation ?? data.defaultAllocation;

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
              <CalendarRange aria-hidden="true" className="size-3.5" />
              Monthly planning
            </div>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Give every percent a purpose.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/72 sm:text-base">
              Create one active allocation per month. Every change becomes a permanent
              version with its reason attached.
            </p>
          </div>
          <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              Selected month
            </p>
            <p className="mt-2 font-display text-2xl font-semibold">
              {monthLabel(data.selectedMonth)}
            </p>
            <p className="mt-1 text-xs text-white/60">
              {data.currentVersion
                ? `Active version ${data.currentVersion.versionNumber}`
                : "No plan yet"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.4rem] border bg-card p-4 sm:p-5">
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="plan-month-picker"
              className="mb-2 block text-sm font-medium"
            >
              Plan month
            </label>
            <input
              id="plan-month-picker"
              type="month"
              name="month"
              defaultValue={data.selectedMonth}
              required
              className="h-12 w-full rounded-xl border bg-background px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <button
            type="submit"
            className="min-h-12 cursor-pointer rounded-xl border bg-background px-5 text-sm font-semibold transition hover:border-primary/30 hover:text-primary"
          >
            Open month
          </button>
        </form>
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="surface-shadow rounded-[1.4rem] border bg-card p-5 sm:p-7">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              {data.currentVersion ? "Current plan" : "New plan"}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.035em]">
              {monthLabel(data.selectedMonth)} allocation
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {data.currentVersion
                ? "The active version is prefilled. Saving creates history; it never overwrites it."
                : "The starting suggestion is editable and has no effect until you activate it."}
            </p>
          </div>
          {data.currentVersion ? (
            <>
              <div className="rounded-2xl border bg-muted/35 p-4">
                <p className="text-xs text-muted-foreground">Active version</p>
                <p className="mt-1 font-display text-3xl font-semibold">
                  {data.currentVersion.versionNumber}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Revisions open in a focused review window and always require a reason
                  before activation.
                </p>
              </div>
              <MonthlyPlanRevisionDialog
                allocation={allocation}
                month={data.selectedMonth}
                nextVersion={data.currentVersion.versionNumber + 1}
              />
            </>
          ) : (
            <MonthlyPlanForm
              key={data.selectedMonth}
              month={data.selectedMonth}
              allocation={allocation}
              isRevision={false}
              nextVersion={1}
            />
          )}
        </div>

        <div className="space-y-5">
          <section className="rounded-[1.4rem] border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck aria-hidden="true" className="size-4.5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold">
                  Active allocation
                </h2>
                <p className="text-xs text-muted-foreground">
                  Exactly 100%, checked twice
                </p>
              </div>
            </div>
            {data.currentVersion ? (
              <>
                <div className="mt-5 rounded-2xl border bg-muted/30 p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Actual family income
                  </p>
                  <div className="mt-2">
                    <MoneyTotals
                      emptyLabel="No income recorded for this month"
                      totals={data.incomeTotals}
                    />
                  </div>
                  {data.missingRateCurrencies.length > 0 ? (
                    <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">
                      Add manual rates for {data.missingRateCurrencies.join(", ")} to
                      calculate planned DZD amounts.
                    </p>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {Object.entries(data.currentVersion.allocation).map(
                    ([label, value]) => (
                      <div key={label} className="rounded-2xl bg-muted/55 p-4">
                        <p className="text-xs capitalize text-muted-foreground">
                          {label}
                        </p>
                        <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
                          {value.toFixed(2)}%
                        </p>
                        <p className="mt-1 text-xs font-medium text-muted-foreground tabular-nums">
                          {data.plannedAmounts
                            ? formatMoney(
                                data.plannedAmounts[
                                  label as keyof typeof data.plannedAmounts
                                ],
                                { maximumFractionDigits: 2 },
                              )
                            : data.familyIncomeDzd === 0
                              ? formatMoney(0)
                              : "DZD amount unavailable"}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed px-5 py-10 text-center">
                <p className="font-medium">This month has no active plan.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Adjust the suggestion and activate version one.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-[1.4rem] border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold">Version history</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reasons and allocations remain viewable
                </p>
              </div>
              <History aria-hidden="true" className="size-5 text-muted-foreground" />
            </div>
            {!data.selectedPlan?.versions.length ? (
              <p className="mt-5 rounded-2xl bg-muted/45 p-5 text-sm text-muted-foreground">
                History begins when the first valid plan is activated.
              </p>
            ) : (
              <ol className="mt-5 space-y-3">
                {data.selectedPlan.versions.map((version) => (
                  <li
                    key={version.id}
                    className={`rounded-2xl border p-4 ${version.id === data.selectedPlan?.currentVersionId ? "border-emerald-500/25 bg-emerald-500/[0.05]" : "bg-muted/30"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">
                          Version {version.versionNumber}
                          {version.id === data.selectedPlan?.currentVersionId
                            ? " · Active"
                            : ""}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {version.reason}
                        </p>
                      </div>
                      <Clock3
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {version.createdBy} ·{" "}
                      {new Intl.DateTimeFormat("en-DZ", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Africa/Algiers",
                      }).format(new Date(version.createdAt))}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
