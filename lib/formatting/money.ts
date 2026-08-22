export type MoneyFormatOptions = {
  compact?: boolean;
  currency?: string;
  locale?: string;
  maximumFractionDigits?: number;
};

const currencyLabels: Record<string, string> = {
  DZD: "DA",
  EUR: "€",
  USD: "$",
};

export function formatMoney(
  amount: number,
  {
    compact = false,
    currency = "DZD",
    locale = "en-DZ",
    maximumFractionDigits = 0,
  }: MoneyFormatOptions = {},
) {
  if (!Number.isFinite(amount)) {
    return "—";
  }

  const normalizedAmount = Object.is(amount, -0) ? 0 : amount;
  const number = new Intl.NumberFormat(locale, {
    compactDisplay: "short",
    maximumFractionDigits,
    minimumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(normalizedAmount);

  return `${number} ${currencyLabels[currency] ?? currency}`;
}
