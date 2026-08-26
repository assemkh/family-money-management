import "server-only";

import type { HouseholdContext } from "@/lib/auth/household-context";
import type { ExchangeRateMap } from "@/lib/finance/calculations";
import { getAlgiersDateValues } from "@/lib/formatting/date";

export type ManualExchangeRate = {
  currency: "EUR" | "USD";
  rate: number | null;
  effectiveDate: string | null;
};

export type EffectiveRates = {
  rates: ExchangeRateMap;
  details: Map<string, ManualExchangeRate>;
};

function latestRates(
  rows: Array<{
    currency: string;
    rate_to_base: number | string;
    effective_date: string;
  }>,
) {
  const rates: ExchangeRateMap = {};
  const details = new Map<"EUR" | "USD", ManualExchangeRate>();

  rows.forEach((row) => {
    if (row.currency !== "EUR" && row.currency !== "USD") return;
    if (details.has(row.currency)) return;

    const rate = Number(row.rate_to_base);
    rates[row.currency] = rate;
    details.set(row.currency, {
      currency: row.currency,
      rate,
      effectiveDate: row.effective_date,
    });
  });

  return { rates, details };
}

/**
 * The only reader of `exchange_rates`. Returns the rate map every DZD Valuation
 * needs plus the per-currency effective date that the accounts and settings surfaces
 * display, so no read model writes that query again.
 */
export async function readEffectiveRates(
  context: Pick<HouseholdContext, "db" | "householdId">,
): Promise<EffectiveRates> {
  const { date } = getAlgiersDateValues();
  const { data, error } = await context.db
    .from("exchange_rates")
    .select("currency, rate_to_base, effective_date")
    .eq("family_id", context.householdId)
    .lte("effective_date", date)
    .order("effective_date", { ascending: false });

  if (error) throw new Error("Exchange rates could not be loaded.");

  return latestRates(data ?? []);
}
