import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowDownToLine, CalendarDays, UsersRound } from "lucide-react";

import { IncomeEntryForm } from "@/components/finance/income-entry-form";
import { HouseholdMemberForm } from "@/components/finance/household-member-form";
import { MoneyTotals } from "@/components/finance/money-totals";
import { formatMonth } from "@/lib/formatting/date";
import { formatMoney } from "@/lib/formatting/money";
import { getIncomePageData } from "@/lib/finance/data";

export const metadata: Metadata = { title: "Income" };

export default async function IncomePage() {
  const data = await getIncomePageData();
  if (!data) redirect("/login");

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="reveal relative overflow-hidden rounded-[1.6rem] border bg-primary px-6 py-7 text-primary-foreground shadow-[0_24px_60px_hsl(var(--primary)/0.16)] sm:px-9 sm:py-9">
        <div
          className="paper-grid absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/75">
              <ArrowDownToLine aria-hidden="true" className="size-3.5" />
              Phase 2A · Money in
            </div>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Record family income.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/72 sm:text-base">
              Add each monthly source once and keep person totals separate without
              losing the family view.
            </p>
          </div>
          <div className="min-w-64 rounded-2xl border border-white/12 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              Current month total
            </p>
            <div className="mt-3 [&_span]:border-white/10 [&_span]:bg-white/[0.08]">
              <MoneyTotals emptyLabel="No income yet" totals={data.totals} />
            </div>
          </div>
        </div>
      </section>

      {data.canManageMembers && !data.hasHouseholdMember ? (
        <section className="rounded-[1.4rem] border bg-card p-5 sm:p-7">
          <div className="mb-6 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              Private household access
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.035em]">
              Add your wife’s secure login
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Create her separate username and email login, then her income sources
              become available to both of you.
            </p>
          </div>
          <HouseholdMemberForm />
        </section>
      ) : null}

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div
          id="income-entry"
          className="surface-shadow scroll-mt-28 rounded-[1.4rem] border bg-card p-5 sm:p-7"
        >
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              New entry
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.035em]">
              Add monthly income
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Source, person, month, currency, and amount are stored as one real
              household entry.
            </p>
          </div>
          <IncomeEntryForm defaultMonth={data.defaultMonth} sources={data.sources} />
        </div>

        <div className="space-y-5">
          <section className="rounded-[1.4rem] border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary/[0.08] text-primary">
                <UsersRound aria-hidden="true" className="size-4.5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold tracking-[-0.025em]">
                  Income by person
                </h2>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {data.memberTotals.map((member) => (
                <article key={member.memberId} className="rounded-2xl bg-muted/55 p-4">
                  <p className="text-sm font-semibold">{member.memberName}</p>
                  <div className="mt-2">
                    <MoneyTotals
                      emptyLabel="No income recorded"
                      totals={member.totals}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[1.4rem] border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-[-0.025em]">
                  Recent income
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The latest 12 household entries
                </p>
              </div>
              <CalendarDays
                aria-hidden="true"
                className="size-5 text-muted-foreground"
              />
            </div>

            {data.recent.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed bg-muted/25 px-5 py-10 text-center">
                <p className="font-medium">No income has been entered yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your first saved entry will appear here.
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
                      <p className="truncate text-sm font-semibold">
                        {entry.sourceName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {entry.memberName} ·{" "}
                        {formatMonth(new Date(`${entry.month}T12:00:00Z`))}
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
      </section>
    </div>
  );
}
