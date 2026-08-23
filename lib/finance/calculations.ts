import type { SupportedCurrency } from "@/lib/finance/validation";

export type ExchangeRateMap = Partial<Record<"EUR" | "USD", number>>;

export type FinancialHealthStatus = "positive" | "warning" | "negative" | "neutral";

export type FinancialHealthThresholds = Readonly<{
  positiveSavingRate: number;
  neutralSavingRate: number;
  positivePlanVariance: number;
  warningPlanVariance: number;
}>;

export const defaultFinancialHealthThresholds: FinancialHealthThresholds =
  Object.freeze({
    positiveSavingRate: 20,
    neutralSavingRate: 10,
    positivePlanVariance: 0.1,
    warningPlanVariance: 0.25,
  });

export function classifySavingRate(
  savingRate: number,
  thresholds: FinancialHealthThresholds = defaultFinancialHealthThresholds,
): FinancialHealthStatus {
  if (savingRate >= thresholds.positiveSavingRate) return "positive";
  if (savingRate >= thresholds.neutralSavingRate) return "neutral";
  return "warning";
}

export function classifyPlanVariance(
  variance: number | null,
  thresholds: FinancialHealthThresholds = defaultFinancialHealthThresholds,
): FinancialHealthStatus {
  if (variance === null) return "neutral";
  if (variance <= thresholds.positivePlanVariance) return "positive";
  if (variance <= thresholds.warningPlanVariance) return "warning";
  return "negative";
}

export function convertToDzd(
  amount: number,
  currency: SupportedCurrency,
  rates: ExchangeRateMap,
): number | null {
  if (!Number.isFinite(amount)) return null;
  if (currency === "DZD") return amount;

  const rate = rates[currency];
  if (!rate || !Number.isFinite(rate) || rate <= 0) return null;

  return amount * rate;
}

export function calculateGain(currentValue: number, purchaseValue: number) {
  const gain = currentValue - purchaseValue;
  const returnPercentage = purchaseValue > 0 ? (gain / purchaseValue) * 100 : null;

  return { gain, returnPercentage };
}

export function calculateLiabilityRemaining(
  originalAmount: number,
  paidAmount: number,
) {
  return Math.max(originalAmount - paidAmount, 0);
}

export function calculateDzdTotal(
  rows: Array<{ amount: number; currency: SupportedCurrency }>,
  rates: ExchangeRateMap,
) {
  const missingCurrencies = new Set<Exclude<SupportedCurrency, "DZD">>();
  let total = 0;

  rows.forEach((row) => {
    const converted = convertToDzd(row.amount, row.currency, rates);
    if (converted === null) {
      if (row.currency !== "DZD" && row.amount !== 0) {
        missingCurrencies.add(row.currency);
      }
      return;
    }
    total += converted;
  });

  return {
    total,
    missingCurrencies: [...missingCurrencies].sort(),
    complete: missingCurrencies.size === 0,
  };
}

export function calculatePlannedAmount(income: number, percentage: number) {
  if (!Number.isFinite(income) || !Number.isFinite(percentage)) return 0;
  return (income * percentage) / 100;
}

export function calculateMonthlyFlow({
  expenses,
  income,
  investments,
  savings,
}: {
  expenses: number;
  income: number;
  investments: number;
  savings: number;
}) {
  return {
    remaining: income - expenses - savings - investments,
    savingRate: income > 0 ? ((savings + investments) / income) * 100 : 0,
  };
}

export function calculatePercentageBreakdown<T extends { amount: number }>(rows: T[]) {
  const total = rows.reduce((sum, row) => sum + Math.max(row.amount, 0), 0);

  return rows
    .filter((row) => row.amount > 0)
    .map((row) => ({
      ...row,
      percentage: total > 0 ? (row.amount / total) * 100 : 0,
    }))
    .sort((left, right) => right.amount - left.amount);
}

export function calculateAveragePlanVariance(
  rows: Array<{ actual: number; planned: number | null }>,
) {
  const comparable = rows.filter(
    (row): row is { actual: number; planned: number } =>
      row.planned !== null && row.planned > 0,
  );
  if (comparable.length === 0) return null;

  return (
    comparable.reduce(
      (total, row) => total + Math.abs(row.actual - row.planned) / row.planned,
      0,
    ) / comparable.length
  );
}
