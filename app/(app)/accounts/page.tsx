import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeftRight,
  Banknote,
  CircleDollarSign,
  Landmark,
  WalletCards,
} from "lucide-react";

import { AccountBalanceForm } from "@/components/finance/account-balance-form";
import { ExchangeRateForm } from "@/components/finance/exchange-rate-form";
import { getAccountsPageData } from "@/lib/finance/data";
import { formatMoney } from "@/lib/formatting/money";

export const metadata: Metadata = { title: "Accounts" };

const accountTypeLabels: Record<string, string> = {
  cash: "Cash",
  bank: "Bank account",
  postal: "Postal account",
  foreign_currency: "Foreign currency",
  digital_wallet: "Digital wallet",
  other: "Other account",
};

export default async function AccountsPage() {
  const data = await getAccountsPageData();
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
              <WalletCards aria-hidden="true" className="size-3.5" />
              Phase 2A · Liquid money
            </div>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Know where the money is.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/72 sm:text-base">
              Current balances, manual currency valuations, and transfer-ready accounts
              in one private household view.
            </p>
          </div>
          <div className="min-w-64 rounded-2xl border border-white/12 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              Known liquid value
            </p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] tabular-nums">
              {formatMoney(data.knownDzdValue, {
                currency: "DZD",
                maximumFractionDigits: 2,
              })}
            </p>
            {data.missingRateCurrencies.length > 0 ? (
              <p className="mt-2 text-xs leading-5 text-amber-200">
                Excludes {data.missingRateCurrencies.join(" and ")} until a manual rate
                is saved.
              </p>
            ) : (
              <p className="mt-2 text-xs text-white/60">All active accounts valued.</p>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="liquid-accounts-heading">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              Liquid money
            </p>
            <h2
              id="liquid-accounts-heading"
              className="mt-2 font-display text-2xl font-semibold tracking-[-0.035em]"
            >
              Active accounts
            </h2>
          </div>
          <Link
            href="/transfers"
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold shadow-sm transition hover:border-primary/30 hover:text-primary"
          >
            <ArrowLeftRight aria-hidden="true" className="size-4" />
            Move money
          </Link>
        </div>

        {data.accounts.length === 0 ? (
          <div className="rounded-[1.4rem] border border-dashed bg-card p-10 text-center">
            <p className="font-medium">No active accounts yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Account creation will be available in household settings.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {data.accounts.map((account) => {
              const Icon =
                account.type === "cash"
                  ? Banknote
                  : account.type === "foreign_currency"
                    ? CircleDollarSign
                    : Landmark;

              return (
                <article
                  key={account.id}
                  className="surface-shadow rounded-[1.35rem] border bg-card p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-11 place-items-center rounded-2xl bg-primary/[0.08] text-primary">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      {account.currency}
                    </span>
                  </div>
                  <p className="mt-5 text-sm font-semibold">{account.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {accountTypeLabels[account.type] ?? "Account"}
                  </p>
                  <p className="mt-4 font-display text-2xl font-semibold tracking-[-0.035em] tabular-nums">
                    {formatMoney(account.currentBalance, {
                      currency: account.currency,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  {account.currency === "DZD" ? (
                    <p className="mt-1 text-xs text-muted-foreground">Base currency</p>
                  ) : account.dzdValue === null ? (
                    <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                      Add rate to calculate DZD value
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      ≈{" "}
                      {formatMoney(account.dzdValue, {
                        currency: "DZD",
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  )}
                  <AccountBalanceForm
                    accountId={account.id}
                    currency={account.currency}
                    currentBalance={account.currentBalance}
                  />
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-[1.4rem] border bg-card p-5 sm:p-7">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
            Manual valuation
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.035em]">
            Exchange rates
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Rates are entered by your household. The app never fetches or invents a
            market rate.
          </p>
        </div>
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {data.exchangeRates.map((exchangeRate) => (
            <ExchangeRateForm
              key={exchangeRate.currency}
              defaultDate={data.defaultDate}
              exchangeRate={exchangeRate}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
