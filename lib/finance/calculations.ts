import type { SupportedCurrency } from "@/lib/finance/validation";

export type ExchangeRateMap = Partial<Record<"EUR" | "USD", number>>;

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
