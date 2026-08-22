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
