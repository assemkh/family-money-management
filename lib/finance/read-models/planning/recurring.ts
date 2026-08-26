import "server-only";

import { requireHouseholdContext } from "@/lib/auth/household-context";
import { ensureNoQueryErrors } from "@/lib/finance/read-models/query-errors";
import type { ExpenseCategoryOption } from "@/lib/finance/read-models/cash-flow/expenses";
import type { SupportedCurrency } from "@/lib/finance/validation";
import { getAlgiersDateValues } from "@/lib/formatting/date";

export type RecurringItem = {
  id: string;
  name: string;
  type: string;
  amount: number;
  currency: SupportedCurrency;
  frequency: string;
  customIntervalDays: number | null;
  nextDueDate: string;
  categoryName: string | null;
};

export async function getRecurringPageData() {
  const { db: supabase, householdId } = await requireHouseholdContext();
  const [itemsResult, categoriesResult] = await Promise.all([
    supabase
      .from("recurring_transactions")
      .select(
        "id, name, type, amount, currency, frequency, custom_interval_days, next_due_date, category_id",
      )
      .eq("family_id", householdId)
      .eq("active", true)
      .order("next_due_date", { ascending: true }),
    supabase
      .from("expense_categories")
      .select("id, name, type")
      .eq("family_id", householdId)
      .eq("is_active", true)
      .order("name"),
  ]);
  ensureNoQueryErrors(
    [itemsResult, categoriesResult],
    "Recurring data could not be loaded.",
  );
  const categories = (categoriesResult.data ?? []).map(
    (category): ExpenseCategoryOption => ({
      id: category.id,
      name: category.name,
      type: category.type,
    }),
  );
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  return {
    defaultDate: getAlgiersDateValues().date,
    categories,
    items: (itemsResult.data ?? []).map((row): RecurringItem => ({
      id: row.id,
      name: row.name,
      type: row.type,
      amount: Number(row.amount),
      currency: row.currency as SupportedCurrency,
      frequency: row.frequency,
      customIntervalDays: row.custom_interval_days,
      nextDueDate: row.next_due_date,
      categoryName: row.category_id
        ? (categoryNames.get(row.category_id) ?? null)
        : null,
    })),
  };
}
