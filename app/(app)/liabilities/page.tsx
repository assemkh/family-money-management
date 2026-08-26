import type { Metadata } from "next";
import { HandCoins } from "lucide-react";
import { redirect } from "next/navigation";
import { LiabilityEntryForm } from "@/components/finance/liability-entry-form";
import { formatMoney } from "@/lib/formatting/money";
import { calculateLiabilityRemaining } from "@/lib/finance/calculations";
import { getLiabilitiesPageData } from "@/lib/finance/data";
export const metadata: Metadata = { title: "Liabilities" };
export default async function LiabilitiesPage() {
  const items = await getLiabilitiesPageData();
  if (!items) redirect("/login");
  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-[1.6rem] border bg-primary px-6 py-7 text-primary-foreground sm:px-9 sm:py-9">
        <div
          className="paper-grid absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/75">
            <HandCoins className="size-3.5" aria-hidden="true" />
            Family liabilities
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            See every amount still owed.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
            Original, paid, and remaining balances reconcile on every liability.
          </p>
        </div>
      </section>
      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="surface-shadow rounded-[1.4rem] border bg-card p-5 sm:p-7">
          <h2 className="mb-6 font-display text-2xl font-semibold">Add liability</h2>
          <LiabilityEntryForm />
        </div>
        <div className="rounded-[1.4rem] border bg-card p-5 sm:p-6">
          <h2 className="font-display text-2xl font-semibold">Outstanding balances</h2>
          {items.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No liabilities recorded.
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {items.map((item) => {
                const remaining = calculateLiabilityRemaining(
                  item.originalAmount,
                  item.paidAmount,
                );
                const progress =
                  item.originalAmount > 0
                    ? Math.min((item.paidAmount / item.originalAmount) * 100, 100)
                    : 0;
                return (
                  <li key={item.id} className="rounded-2xl bg-muted/50 p-4">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="mt-1 text-xs capitalize text-muted-foreground">
                          {item.type} · {item.status}
                        </p>
                      </div>
                      <p className="text-end font-display text-xl font-semibold">
                        {formatMoney(remaining, {
                          currency: item.currency,
                          maximumFractionDigits: 2,
                        })}
                        <span className="mt-1 block font-sans text-xs font-normal text-muted-foreground">
                          remaining
                        </span>
                      </p>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Paid{" "}
                      {formatMoney(item.paidAmount, {
                        currency: item.currency,
                        maximumFractionDigits: 2,
                      })}{" "}
                      of{" "}
                      {formatMoney(item.originalAmount, {
                        currency: item.currency,
                        maximumFractionDigits: 2,
                      })}
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
