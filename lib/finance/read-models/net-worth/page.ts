import "server-only";

import { requireHouseholdContext } from "@/lib/auth/household-context";
import { calculateDzdTotal } from "@/lib/finance/calculations";
import { readEffectiveRates } from "@/lib/finance/valuation/rates";
import { ensureNoQueryErrors } from "@/lib/finance/read-models/query-errors";
import type { SupportedCurrency } from "@/lib/finance/validation";
import { getAlgiersDateValues } from "@/lib/formatting/date";

export type NetWorthSnapshot = {
  id: string;
  month: string;
  accounts: number;
  assets: number;
  investments: number;
  liabilities: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  rates: Record<string, number>;
  capturedAt: string;
};

export async function getNetWorthPageData() {
  const { db: supabase, householdId } = await requireHouseholdContext();
  const { month, monthStart } = getAlgiersDateValues();
  const [
    accountsResult,
    assetsResult,
    investmentsResult,
    liabilitiesResult,
    ratesResult,
    snapshotsResult,
  ] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, type, currency, current_balance")
      .eq("family_id", householdId)
      .eq("is_active", true),
    supabase
      .from("assets")
      .select("id, name, asset_type, currency, current_value")
      .eq("family_id", householdId)
      .eq("is_active", true),
    supabase
      .from("investments")
      .select("id, name, type, currency, current_value")
      .eq("family_id", householdId),
    supabase
      .from("liabilities")
      .select("id, name, type, currency, original_amount, paid_amount, status")
      .eq("family_id", householdId)
      .eq("status", "active"),
    readEffectiveRates({ db: supabase, householdId }),
    supabase
      .from("net_worth_snapshots")
      .select(
        "id, snapshot_month, accounts_dzd, assets_dzd, investments_dzd, liabilities_dzd, total_assets_dzd, total_liabilities_dzd, net_worth_dzd, rates_snapshot, captured_at",
      )
      .eq("family_id", householdId)
      .order("snapshot_month", { ascending: false })
      .limit(12),
  ]);
  ensureNoQueryErrors(
    [
      accountsResult,
      assetsResult,
      investmentsResult,
      liabilitiesResult,
      snapshotsResult,
    ],
    "Net worth data could not be loaded.",
  );

  const { rates } = ratesResult;
  const accounts = calculateDzdTotal(
    (accountsResult.data ?? []).map((row) => ({
      amount: Number(row.current_balance),
      currency: row.currency as SupportedCurrency,
    })),
    rates,
  );
  const assets = calculateDzdTotal(
    (assetsResult.data ?? []).map((row) => ({
      amount: Number(row.current_value),
      currency: row.currency as SupportedCurrency,
    })),
    rates,
  );
  const investments = calculateDzdTotal(
    (investmentsResult.data ?? []).map((row) => ({
      amount: Number(row.current_value),
      currency: row.currency as SupportedCurrency,
    })),
    rates,
  );
  const liabilities = calculateDzdTotal(
    (liabilitiesResult.data ?? []).map((row) => ({
      amount: Math.max(Number(row.original_amount) - Number(row.paid_amount), 0),
      currency: row.currency as SupportedCurrency,
    })),
    rates,
  );
  const missingRateCurrencies = [
    ...new Set([
      ...accounts.missingCurrencies,
      ...assets.missingCurrencies,
      ...investments.missingCurrencies,
      ...liabilities.missingCurrencies,
    ]),
  ].sort();
  const complete = missingRateCurrencies.length === 0;
  const totalAssets = accounts.total + assets.total + investments.total;
  const snapshots: NetWorthSnapshot[] = (snapshotsResult.data ?? []).map((row) => ({
    id: row.id,
    month: row.snapshot_month.slice(0, 7),
    accounts: Number(row.accounts_dzd),
    assets: Number(row.assets_dzd),
    investments: Number(row.investments_dzd),
    liabilities: Number(row.liabilities_dzd),
    totalAssets: Number(row.total_assets_dzd),
    totalLiabilities: Number(row.total_liabilities_dzd),
    netWorth: Number(row.net_worth_dzd),
    rates: (row.rates_snapshot ?? {}) as Record<string, number>,
    capturedAt: row.captured_at,
  }));
  const latestSnapshot = snapshots[0] ?? null;
  const previousSnapshot = snapshots[1] ?? null;

  return {
    currentMonth: month,
    currentMonthStart: monthStart,
    complete,
    missingRateCurrencies,
    accounts: accounts.total,
    assets: assets.total,
    investments: investments.total,
    totalAssets,
    totalLiabilities: liabilities.total,
    netWorth: complete ? totalAssets - liabilities.total : null,
    snapshots,
    currentMonthCaptured: snapshots.some((snapshot) => snapshot.month === month),
    monthChange:
      latestSnapshot && previousSnapshot
        ? latestSnapshot.netWorth - previousSnapshot.netWorth
        : null,
  };
}
