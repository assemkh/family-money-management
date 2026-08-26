import "server-only";

import { requireHouseholdContext } from "@/lib/auth/household-context";
import { ensureNoQueryErrors } from "@/lib/finance/read-models/query-errors";
import { getAlgiersDateValues } from "@/lib/formatting/date";
import { convertToDzd } from "@/lib/finance/calculations";
import { readEffectiveRates } from "@/lib/finance/valuation/rates";
import type { ManualExchangeRate } from "@/lib/finance/valuation/rates";
import type { SupportedCurrency } from "@/lib/finance/validation";

export type AccountOption = {
  id: string;
  name: string;
  currency: SupportedCurrency;
  currentBalance: number;
};

export type AccountSummary = AccountOption & {
  type: string;
  dzdValue: number | null;
};

export async function getAccountsPageData() {
  const { db: supabase, householdId } = await requireHouseholdContext();
  // `defaultDate` seeds the exchange-rate form on this page; the rate cutoff itself
  // now belongs to the valuation Module.
  const { date } = getAlgiersDateValues();
  const [accountsResult, ratesResult] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, type, currency, current_balance")
      .eq("family_id", householdId)
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    readEffectiveRates({ db: supabase, householdId }),
  ]);

  ensureNoQueryErrors([accountsResult], "Account data could not be loaded.");

  const { rates, details } = ratesResult;
  const accounts = (accountsResult.data ?? []).map((account): AccountSummary => {
    const currency = account.currency as SupportedCurrency;
    const currentBalance = Number(account.current_balance);

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currency,
      currentBalance,
      dzdValue: convertToDzd(currentBalance, currency, rates),
    };
  });

  const knownDzdValue = accounts.reduce(
    (total, account) => total + (account.dzdValue ?? 0),
    0,
  );
  const missingRateCurrencies = [
    ...new Set(
      accounts
        .filter((account) => account.currency !== "DZD" && account.dzdValue === null)
        .map((account) => account.currency),
    ),
  ];

  return {
    accounts,
    defaultDate: date,
    knownDzdValue,
    missingRateCurrencies,
    exchangeRates: (["EUR", "USD"] as const).map(
      (currency): ManualExchangeRate =>
        details.get(currency) ?? { currency, rate: null, effectiveDate: null },
    ),
  };
}
