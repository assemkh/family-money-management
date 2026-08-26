import "server-only";

import { requireHouseholdContext } from "@/lib/auth/household-context";
import { addTotals } from "@/lib/finance/valuation/totals";
import { ensureNoQueryErrors } from "@/lib/finance/read-models/query-errors";
import type { AccountOption } from "@/lib/finance/read-models/net-worth/accounts";
import type { SupportedCurrency } from "@/lib/finance/validation";
import { getAlgiersDateValues } from "@/lib/formatting/date";

export type ExpenseCategoryOption = {
  id: string;
  name: string;
  type: string;
};

export type RecentExpense = {
  id: string;
  transactionDate: string;
  amount: number;
  currency: SupportedCurrency;
  note: string | null;
  categoryName: string;
  categoryType: string;
  accountName: string | null;
  memberName: string;
};

export async function getExpensePageData() {
  const { db: supabase, householdId, member } = await requireHouseholdContext();
  const { date, monthStart } = getAlgiersDateValues();
  const [membersResult, categoriesResult, accountsResult, monthResult, recentResult] =
    await Promise.all([
      supabase.from("profiles").select("id, display_name").eq("family_id", householdId),
      supabase
        .from("expense_categories")
        .select("id, name, type")
        .eq("family_id", householdId)
        .eq("is_active", true)
        .order("type")
        .order("sort_order")
        .order("name"),
      supabase
        .from("accounts")
        .select("id, name, currency, current_balance")
        .eq("family_id", householdId)
        .eq("is_active", true)
        .order("sort_order")
        .order("name"),
      supabase
        .from("expense_entries")
        .select("amount, currency")
        .eq("family_id", householdId)
        .eq("month_key", monthStart),
      supabase
        .from("expense_entries")
        .select(
          "id, transaction_date, amount, currency, note, subcategory_id, payment_account_id, member_id, main_category",
        )
        .eq("family_id", householdId)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

  ensureNoQueryErrors(
    [membersResult, categoriesResult, accountsResult, monthResult, recentResult],
    "Expense data could not be loaded.",
  );

  const members = membersResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const accounts = accountsResult.data ?? [];
  const memberNames = new Map(
    members.map((member) => [member.id, member.display_name]),
  );
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]));

  return {
    currentMemberName: member.displayName,
    defaultDate: date,
    totals: addTotals(monthResult.data ?? []),
    categories: categories.map((category): ExpenseCategoryOption => ({
      id: category.id,
      name: category.name,
      type: category.type,
    })),
    accounts: accounts.map((account): AccountOption => ({
      id: account.id,
      name: account.name,
      currency: account.currency as SupportedCurrency,
      currentBalance: Number(account.current_balance),
    })),
    recent: (recentResult.data ?? []).map((entry): RecentExpense => {
      const category = entry.subcategory_id
        ? categoryMap.get(entry.subcategory_id)
        : null;

      return {
        id: entry.id,
        transactionDate: entry.transaction_date,
        amount: Number(entry.amount),
        currency: entry.currency as SupportedCurrency,
        note: entry.note,
        categoryName: category?.name ?? "Uncategorized",
        categoryType: category?.type ?? entry.main_category,
        accountName: entry.payment_account_id
          ? (accountNames.get(entry.payment_account_id) ?? null)
          : null,
        memberName: memberNames.get(entry.member_id) ?? "Family member",
      };
    }),
  };
}
