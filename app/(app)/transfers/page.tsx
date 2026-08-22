import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeftRight, ShieldCheck } from "lucide-react";

import { TransferEntryForm } from "@/components/finance/transfer-entry-form";
import { formatShortDate } from "@/lib/formatting/date";
import { getTransfersPageData } from "@/lib/finance/data";
import { formatMoney } from "@/lib/formatting/money";

export const metadata: Metadata = { title: "Transfers" };

export default async function TransfersPage() {
  const data = await getTransfersPageData();
  if (!data) redirect("/login");

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="reveal relative overflow-hidden rounded-[1.6rem] border bg-[hsl(var(--sidebar))] px-6 py-7 text-white shadow-[0_24px_60px_rgba(15,23,42,0.16)] sm:px-9 sm:py-9">
        <div
          className="paper-grid absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
        />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/70">
            <ArrowLeftRight aria-hidden="true" className="size-3.5" />
            Phase 2A · Internal movement
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            Move money without inflating spending.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
            Transfers move money between places your family already owns. They are never
            recorded as consumption expenses.
          </p>
        </div>
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="surface-shadow rounded-[1.4rem] border bg-card p-5 sm:p-7">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              New transfer
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.035em]">
              Choose the route
            </h2>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted/55 px-3.5 py-3 text-sm leading-6 text-muted-foreground">
              <ShieldCheck
                aria-hidden="true"
                className="mt-1 size-4 shrink-0 text-primary"
              />
              Both balances change in one database transaction. If any check fails,
              neither balance changes.
            </div>
          </div>
          <TransferEntryForm accounts={data.accounts} defaultDate={data.defaultDate} />
        </div>

        <section className="rounded-[1.4rem] border bg-card p-5 sm:p-6">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-[-0.025em]">
              Transfer history
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The latest 20 internal movements
            </p>
          </div>

          {data.recent.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed bg-muted/25 px-5 py-10 text-center">
              <p className="font-medium">No transfers yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your first completed transfer will appear here.
              </p>
            </div>
          ) : (
            <ul className="mt-5 divide-y">
              {data.recent.map((transfer) => (
                <li
                  key={transfer.id}
                  className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {transfer.fromAccountName}
                      <span className="mx-2 text-muted-foreground" aria-hidden="true">
                        →
                      </span>
                      {transfer.toAccountName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatShortDate(transfer.transferDate)}
                    </p>
                    {transfer.note ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {transfer.note}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatMoney(transfer.amount, {
                      currency: transfer.currency,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </div>
  );
}
