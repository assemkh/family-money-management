import { Gem, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";

import { PortfolioEntryForm } from "@/components/finance/portfolio-entry-form";
import { formatMoney } from "@/lib/formatting/money";
import { calculateGain } from "@/lib/finance/calculations";
import { getPortfolioPageData } from "@/lib/finance/data";
import { getAlgiersDateValues } from "@/lib/formatting/date";

export async function PortfolioPage({ kind }: { kind: "assets" | "investments" }) {
  const items = await getPortfolioPageData(kind);
  if (!items) redirect("/login");
  const isAssets = kind === "assets";
  const Icon = isAssets ? Gem : TrendingUp;
  const label = isAssets ? "Asset" : "Investment";
  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-[1.6rem] border bg-primary px-6 py-7 text-primary-foreground sm:px-9 sm:py-9">
        <div
          className="paper-grid absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/75">
            <Icon className="size-3.5" aria-hidden="true" />
            Family {kind}
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            {isAssets
              ? "Value what your family owns."
              : "Track invested capital clearly."}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
            Purchase and current values stay together so gains and losses remain
            transparent. Valuation records do not move liquid account balances.
          </p>
        </div>
      </section>
      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="surface-shadow rounded-[1.4rem] border bg-card p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            New {label.toLowerCase()}
          </p>
          <h2 className="mb-6 mt-2 font-display text-2xl font-semibold">
            Record valuation
          </h2>
          <PortfolioEntryForm
            kind={isAssets ? "asset" : "investment"}
            defaultDate={getAlgiersDateValues().date}
          />
        </div>
        <div className="rounded-[1.4rem] border bg-card p-5 sm:p-6">
          <h2 className="font-display text-2xl font-semibold">Current {kind}</h2>
          {items.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No {kind} recorded yet.
            </div>
          ) : (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {items.map((item) => {
                const result = calculateGain(item.currentValue, item.purchaseValue);
                return (
                  <li key={item.id} className="rounded-2xl bg-muted/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.name}</p>
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
                      Bought for{" "}
                      {formatMoney(item.purchaseValue, {
                        currency: item.currency,
                        maximumFractionDigits: 2,
                      })}
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
      </section>
    </div>
  );
}
