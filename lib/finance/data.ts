import "server-only";

import { readCurrentProfile } from "@/lib/auth/profile";
import { getAlgiersDateValues } from "@/lib/formatting/date";
import type { SupportedCurrency } from "@/lib/finance/validation";
import { createClient } from "@/lib/supabase/server";

export type MoneyTotal = {
  currency: SupportedCurrency;
  amount: number;
};

export type IncomeSourceOption = {
  id: string;
  name: string;
  memberName: string | null;
  available: boolean;
};

export type RecentIncome = {
  id: string;
  month: string;
  amount: number;
  currency: SupportedCurrency;
  note: string | null;
  sourceName: string;
  memberName: string;
};

export type ExpenseCategoryOption = {
  id: string;
  name: string;
  type: string;
};

export type AccountOption = {
  id: string;
  name: string;
  currency: SupportedCurrency;
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

function addTotals(
  rows: Array<{ amount: number | string; currency: string }>,
): MoneyTotal[] {
  const totals = new Map<SupportedCurrency, number>();

  rows.forEach((row) => {
    const currency = row.currency as SupportedCurrency;
    totals.set(currency, (totals.get(currency) ?? 0) + Number(row.amount));
  });

  return (["DZD", "EUR", "USD"] as const)
    .filter((currency) => totals.has(currency))
    .map((currency) => ({ currency, amount: totals.get(currency) ?? 0 }));
}

function ensureNoQueryErrors(
  results: Array<{ error: { message: string } | null }>,
  message: string,
) {
  if (results.some((result) => result.error)) throw new Error(message);
}

export async function getIncomePageData() {
  const profile = await readCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { month, monthStart } = getAlgiersDateValues();
  const [membersResult, sourcesResult, monthEntriesResult, recentResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name")
        .eq("family_id", profile.familyId)
        .order("display_name"),
      supabase
        .from("income_sources")
        .select("id, name, owner_member_id")
        .eq("family_id", profile.familyId)
        .eq("is_active", true)
        .order("sort_order")
        .order("name"),
      supabase
        .from("income_entries")
        .select("amount, currency, member_id")
        .eq("family_id", profile.familyId)
        .eq("income_month", monthStart),
      supabase
        .from("income_entries")
        .select("id, income_month, amount, currency, note, source_id, member_id")
        .eq("family_id", profile.familyId)
        .order("income_month", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

  ensureNoQueryErrors(
    [membersResult, sourcesResult, monthEntriesResult, recentResult],
    "Income data could not be loaded.",
  );

  const members = membersResult.data ?? [];
  const sources = sourcesResult.data ?? [];
  const monthEntries = monthEntriesResult.data ?? [];
  const memberNames = new Map(
    members.map((member) => [member.id, member.display_name]),
  );
  const sourceNames = new Map(sources.map((source) => [source.id, source.name]));

  const memberTotals = members.map((member) => ({
    memberId: member.id,
    memberName: member.display_name,
    totals: addTotals(monthEntries.filter((entry) => entry.member_id === member.id)),
  }));

  return {
    defaultMonth: month,
    totals: addTotals(monthEntries),
    memberTotals,
    sources: sources.map((source): IncomeSourceOption => ({
      id: source.id,
      name: source.name,
      memberName: source.owner_member_id
        ? (memberNames.get(source.owner_member_id) ?? null)
        : null,
      available: Boolean(source.owner_member_id),
    })),
    recent: (recentResult.data ?? []).map((entry): RecentIncome => ({
      id: entry.id,
      month: entry.income_month,
      amount: Number(entry.amount),
      currency: entry.currency as SupportedCurrency,
      note: entry.note,
      sourceName: sourceNames.get(entry.source_id) ?? "Income source",
      memberName: memberNames.get(entry.member_id) ?? "Family member",
    })),
  };
}

export async function getExpensePageData() {
  const profile = await readCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { date, monthStart } = getAlgiersDateValues();
  const [membersResult, categoriesResult, accountsResult, monthResult, recentResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name")
        .eq("family_id", profile.familyId),
      supabase
        .from("expense_categories")
        .select("id, name, type")
        .eq("family_id", profile.familyId)
        .eq("is_active", true)
        .order("type")
        .order("sort_order")
        .order("name"),
      supabase
        .from("accounts")
        .select("id, name, currency")
        .eq("family_id", profile.familyId)
        .eq("is_active", true)
        .order("sort_order")
        .order("name"),
      supabase
        .from("expense_entries")
        .select("amount, currency")
        .eq("family_id", profile.familyId)
        .eq("month_key", monthStart),
      supabase
        .from("expense_entries")
        .select(
          "id, transaction_date, amount, currency, note, subcategory_id, payment_account_id, member_id, main_category",
        )
        .eq("family_id", profile.familyId)
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
    currentMemberName: profile.displayName,
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
