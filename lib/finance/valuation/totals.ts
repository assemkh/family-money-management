import "server-only";

import type { SupportedCurrency } from "@/lib/finance/validation";

export type MoneyTotal = {
  currency: SupportedCurrency;
  amount: number;
};

/**
 * Groups amounts by currency without converting them. Every surface that shows a
 * "total" for a mixed-currency list starts here; conversion to DZD is a separate,
 * explicitly incomplete-aware step in `lib/finance/calculations.ts`.
 */
export function addTotals(
  rows: Array<{ amount: number | string; currency: string }>,
): MoneyTotal[] {
  const totals = new Map<SupportedCurrency, number>();

  rows.forEach((row) => {
    const currency = row.currency as SupportedCurrency;
    totals.set(currency, (totals.get(currency) ?? 0) + Number(row.amount));
  });

  return (["DZD", "EUR", "USD"] as const)
    .filter((currency) => totals.has(currency))
    .map((currency) => ({ currency, amount: totals.get(currency) ?? 0 }));
}
