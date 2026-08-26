import type { Metadata } from "next";
import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  Scale,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { redirect } from "next/navigation";

import { NetWorthSnapshotForm } from "@/components/finance/net-worth-snapshot-form";
import { getNetWorthPageData } from "@/lib/finance/read-models/net-worth/page";
import { formatMonth } from "@/lib/formatting/date";
import { formatMoney } from "@/lib/formatting/money";

export const metadata: Metadata = { title: "Net worth" };

function monthLabel(month: string) {
  return formatMonth(new Date(`${month}-01T12:00:00Z`));
}

export default async function NetWorthPage() {
  const data = await getNetWorthPageData();
  if (!data) redirect("/login");
  const history = data.snapshots.toReversed();

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="reveal relative overflow-hidden rounded-[1.6rem] border bg-[hsl(210_35%_18%)] px-6 py-8 text-white shadow-[0_24px_60px_hsl(210_35%_18%/0.2)] sm:px-9 sm:py-10">
        <div
          className="paper-grid absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
        />
        <div
          className="absolute -end-20 -top-24 size-72 rounded-full border border-white/10 bg-white/[0.035]"
          aria-hidden="true"
        />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/75">
              <Landmark aria-hidden="true" className="size-3.5" /> Net worth overview
            </div>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
              Current family net worth
            </p>
            <h1 className="mt-2 font-display text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
              {data.netWorth === null
                ? "Valuation incomplete"
                : formatMoney(data.netWorth, { maximumFractionDigits: 2 })}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/68">
              Accounts, gold and other assets, and investments—minus every outstanding
              liability, all valued in DZD.
            </p>
          </div>
          <div className="min-w-64 rounded-2xl border border-white/12 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
              Month-over-month
            </p>
            <p className="mt-2 flex items-center gap-2 font-display text-2xl font-semibold">
              {data.monthChange === null ? (
                "Capture two months to compare"
              ) : (
                <>
                  {data.monthChange >= 0 ? (
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-5 text-emerald-300"
                    />
                  ) : (
                    <ArrowDownRight
                      aria-hidden="true"
                      className="size-5 text-rose-300"
                    />
                  )}
                  {formatMoney(data.monthChange, { maximumFractionDigits: 2 })}
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {!data.complete ? (
        <section className="rounded-[1.3rem] border border-amber-500/25 bg-amber-500/[0.07] p-5 text-amber-900 dark:text-amber-200">
          <p className="font-semibold">Manual exchange rate required</p>
          <p className="mt-1 text-sm leading-6">
            Add current rates for {data.missingRateCurrencies.join(", ")} on the
            Accounts page before calculating or capturing net worth.
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Liquid accounts", value: data.accounts, icon: WalletCards },
          { label: "Gold & other assets", value: data.assets, icon: ShieldCheck },
          { label: "Investments", value: data.investments, icon: ArrowUpRight },
          {
            label: "Outstanding liabilities",
            value: data.totalLiabilities,
            icon: Scale,
          },
        ].map(({ icon: Icon, label, value }) => (
          <article
            key={label}
            className="surface-shadow rounded-[1.3rem] border bg-card p-5"
          >
            <Icon aria-hidden="true" className="size-5 text-primary" />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
              {formatMoney(value, { maximumFractionDigits: 2 })}
            </p>
          </article>
        ))}
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="rounded-[1.4rem] border bg-card p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            Historical accuracy
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em]">
            Freeze this month’s valuation
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A snapshot stores totals and the exact EUR/USD rates used. Current-month
            snapshots can be refreshed; closed months cannot be rewritten.
          </p>
          <div className="mt-6 rounded-2xl bg-muted/45 p-4">
            <p className="text-xs text-muted-foreground">Snapshot month</p>
            <p className="mt-1 font-semibold">{monthLabel(data.currentMonth)}</p>
          </div>
          <div className="mt-5">
            <NetWorthSnapshotForm
              captured={data.currentMonthCaptured}
              disabled={!data.complete}
              month={data.currentMonth}
            />
          </div>
        </div>

        <div className="rounded-[1.4rem] border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">12-month trail</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Captured values remain historically stable
              </p>
            </div>
            <Landmark aria-hidden="true" className="size-5 text-muted-foreground" />
          </div>

          {history.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed bg-muted/25 px-5 py-12 text-center">
              <p className="font-medium">No monthly snapshot yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Capture this month to begin the historical trail.
              </p>
            </div>
          ) : (
            <ol className="mt-6 space-y-3">
              {history.map((snapshot, index) => {
                const previous = history[index - 1];
                const change = previous ? snapshot.netWorth - previous.netWorth : null;
                return (
                  <li
                    key={snapshot.id}
                    className="grid gap-3 rounded-2xl bg-muted/45 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {monthLabel(snapshot.month)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Assets {formatMoney(snapshot.totalAssets)} · Liabilities{" "}
                        {formatMoney(snapshot.totalLiabilities)}
                      </p>
                    </div>
                    <p className="font-display text-xl font-semibold tabular-nums">
                      {formatMoney(snapshot.netWorth, { maximumFractionDigits: 2 })}
                    </p>
                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${change === null ? "bg-background text-muted-foreground" : change >= 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300"}`}
                    >
                      {change === null
                        ? "Baseline"
                        : `${change >= 0 ? "+" : ""}${formatMoney(change)}`}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
