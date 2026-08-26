import { formatMoney } from "@/lib/formatting/money";
import type { MoneyTotal } from "@/lib/finance/valuation/totals";

export function MoneyTotals({
  emptyLabel,
  totals,
}: {
  emptyLabel: string;
  totals: MoneyTotal[];
}) {
  if (totals.length === 0) {
    return (
      <span className="text-sm font-medium text-muted-foreground">{emptyLabel}</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {totals.map((total) => (
        <span
          key={total.currency}
          className="rounded-full border bg-background/75 px-3 py-1.5 text-sm font-semibold tabular-nums shadow-sm"
        >
          {formatMoney(total.amount, {
            currency: total.currency,
            maximumFractionDigits: 2,
          })}
        </span>
      ))}
    </div>
  );
}
