import "server-only";

import { readCurrentProfile } from "@/lib/auth/profile";
import { getAlgiersDateValues } from "@/lib/formatting/date";
import {
  calculateAveragePlanVariance,
  calculateDzdTotal,
  calculateMonthlyFlow,
  calculatePercentageBreakdown,
  calculatePlannedAmount,
  classifyPlanVariance,
  classifySavingRate,
  convertToDzd,
  type ExchangeRateMap,
  type FinancialHealthStatus,
} from "@/lib/finance/calculations";
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
  currentBalance: number;
};

export type AccountSummary = AccountOption & {
  type: string;
  dzdValue: number | null;
};

export type ManualExchangeRate = {
  currency: "EUR" | "USD";
  rate: number | null;
  effectiveDate: string | null;
};

export type RecentTransfer = {
  id: string;
  transferDate: string;
  amount: number;
  currency: SupportedCurrency;
  note: string | null;
  fromAccountName: string;
  toAccountName: string;
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

export type ValuedItem = {
  id: string;
  name: string;
  type: string;
  purchaseValue: number;
  currentValue: number;
  currency: SupportedCurrency;
  date: string | null;
  note: string | null;
};

export type LiabilityItem = {
  id: string;
  name: string;
  type: string;
  originalAmount: number;
  paidAmount: number;
  monthlyPayment: number | null;
  currency: SupportedCurrency;
  dueDate: string | null;
  status: string;
};

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

export type MonthlyPlanAllocation = {
  essentials: number;
  personal: number;
  savings: number;
  investment: number;
  reserve: number;
};

export type MonthlyPlanVersion = {
  id: string;
  versionNumber: number;
  reason: string;
  allocation: MonthlyPlanAllocation;
  createdAt: string;
  createdBy: string;
};

export type MonthlyPlanSummary = {
  id: string;
  month: string;
  status: string;
  currentVersionId: string | null;
  versions: MonthlyPlanVersion[];
};

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: SupportedCurrency;
  targetDate: string | null;
  priority: number;
  status: "active" | "paused" | "completed" | "cancelled";
  note: string | null;
  progressPercent: number;
  remainingAmount: number;
};

export type SavingContribution = {
  id: string;
  transactionDate: string;
  amount: number;
  currency: SupportedCurrency;
  note: string | null;
  goalName: string | null;
  memberName: string;
};

export type InvestmentEvent = {
  id: string;
  transactionDate: string;
  amount: number;
  currency: SupportedCurrency;
  note: string | null;
  investmentName: string;
  memberName: string;
};

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

export type MonthlyReportRow = {
  month: string;
  income: number;
  expenses: number;
  essentials: number;
  personal: number;
  savings: number;
  investments: number;
  remaining: number;
  savingRate: number;
  plannedEssentials: number | null;
  plannedPersonal: number | null;
  plannedSavings: number | null;
  plannedInvestments: number | null;
  planVersion: number | null;
  netWorth: number | null;
  sourceCounts: {
    income: number;
    expenses: number;
    savings: number;
    investments: number;
  };
};

export type ReportActivityType = "all" | "income" | "expense" | "saving" | "investment";

export type ReportActivityPeriod = "month" | "year";

export type ReportActivityFilters = {
  activityType: ReportActivityType;
  memberId: string | null;
  period: ReportActivityPeriod;
};

export type ReportActivityRow = {
  id: string;
  date: string;
  month: string;
  type: Exclude<ReportActivityType, "all">;
  category: string;
  memberId: string;
  memberName: string;
  amount: number;
  currency: SupportedCurrency;
  note: string | null;
};

export type DashboardTrendPoint = {
  month: string;
  income: number;
  spending: number;
  savings: number;
  investments: number;
  netWorth: number | null;
};

export type DashboardBreakdownItem = {
  key: string;
  label: string;
  amount: number;
  percentage: number;
};

export type DashboardPlanRow = {
  key: keyof MonthlyPlanAllocation;
  label: string;
  planned: number | null;
  actual: number;
};

export type DashboardHealthIndicator = {
  label: string;
  value: string;
  description: string;
  status: FinancialHealthStatus;
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
    canManageMembers: profile.role === "owner",
    hasHouseholdMember: members.some((member) => member.id !== profile.id),
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
        .select("id, name, currency, current_balance")
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

function latestRates(
  rows: Array<{
    currency: string;
    rate_to_base: number | string;
    effective_date: string;
  }>,
) {
  const rates: ExchangeRateMap = {};
  const details = new Map<"EUR" | "USD", ManualExchangeRate>();

  rows.forEach((row) => {
    if (row.currency !== "EUR" && row.currency !== "USD") return;
    if (details.has(row.currency)) return;

    const rate = Number(row.rate_to_base);
    rates[row.currency] = rate;
    details.set(row.currency, {
      currency: row.currency,
      rate,
      effectiveDate: row.effective_date,
    });
  });

  return { rates, details };
}

export async function getAccountsPageData() {
  const profile = await readCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { date } = getAlgiersDateValues();
  const [accountsResult, ratesResult] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, type, currency, current_balance")
      .eq("family_id", profile.familyId)
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("exchange_rates")
      .select("currency, rate_to_base, effective_date")
      .eq("family_id", profile.familyId)
      .lte("effective_date", date)
      .order("effective_date", { ascending: false }),
  ]);

  ensureNoQueryErrors(
    [accountsResult, ratesResult],
    "Account data could not be loaded.",
  );

  const { rates, details } = latestRates(ratesResult.data ?? []);
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

export async function getTransfersPageData() {
  const profile = await readCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { date } = getAlgiersDateValues();
  const [accountsResult, transfersResult] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, currency, current_balance")
      .eq("family_id", profile.familyId)
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("transfers")
      .select(
        "id, transfer_date, from_account_id, to_account_id, amount, currency, note",
      )
      .eq("family_id", profile.familyId)
      .order("transfer_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  ensureNoQueryErrors(
    [accountsResult, transfersResult],
    "Transfer data could not be loaded.",
  );

  const accounts = (accountsResult.data ?? []).map((account): AccountOption => ({
    id: account.id,
    name: account.name,
    currency: account.currency as SupportedCurrency,
    currentBalance: Number(account.current_balance),
  }));
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]));

  return {
    accounts,
    defaultDate: date,
    recent: (transfersResult.data ?? []).map((transfer): RecentTransfer => ({
      id: transfer.id,
      transferDate: transfer.transfer_date,
      amount: Number(transfer.amount),
      currency: transfer.currency as SupportedCurrency,
      note: transfer.note,
      fromAccountName: accountNames.get(transfer.from_account_id) ?? "Source account",
      toAccountName: accountNames.get(transfer.to_account_id) ?? "Destination account",
    })),
  };
}

export async function getPortfolioPageData(kind: "assets" | "investments") {
  const profile = await readCurrentProfile();
  if (!profile) return null;
  const supabase = await createClient();
  const query =
    kind === "assets"
      ? supabase
          .from("assets")
          .select(
            "id, name, asset_type, purchase_value, current_value, currency, purchase_date, notes",
          )
          .eq("family_id", profile.familyId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
      : supabase
          .from("investments")
          .select(
            "id, name, type, purchase_cost, current_value, currency, purchase_date, notes",
          )
          .eq("family_id", profile.familyId)
          .order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error)
    throw new Error(
      `${kind === "assets" ? "Asset" : "Investment"} data could not be loaded.`,
    );
  return (data ?? []).map((row): ValuedItem => ({
    id: row.id,
    name: row.name,
    type: "asset_type" in row ? row.asset_type : row.type,
    purchaseValue: Number(
      "purchase_value" in row ? row.purchase_value : row.purchase_cost,
    ),
    currentValue: Number(row.current_value),
    currency: row.currency as SupportedCurrency,
    date: row.purchase_date,
    note: row.notes,
  }));
}

export async function getInvestmentPageData() {
  const profile = await readCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { date, monthStart } = getAlgiersDateValues();
  const [investmentsResult, eventsResult, membersResult] = await Promise.all([
    supabase
      .from("investments")
      .select(
        "id, name, type, purchase_cost, current_value, currency, purchase_date, notes",
      )
      .eq("family_id", profile.familyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("financial_transactions")
      .select(
        "id, transaction_date, month_key, amount, currency, source_id, note, member_id",
      )
      .eq("family_id", profile.familyId)
      .eq("type", "investment")
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("profiles")
      .select("id, display_name")
      .eq("family_id", profile.familyId),
  ]);
  ensureNoQueryErrors(
    [investmentsResult, eventsResult, membersResult],
    "Investment data could not be loaded.",
  );

  const items = (investmentsResult.data ?? []).map((row): ValuedItem => ({
    id: row.id,
    name: row.name,
    type: row.type,
    purchaseValue: Number(row.purchase_cost),
    currentValue: Number(row.current_value),
    currency: row.currency as SupportedCurrency,
    date: row.purchase_date,
    note: row.notes,
  }));
  const investmentNames = new Map(items.map((item) => [item.id, item.name]));
  const memberNames = new Map(
    (membersResult.data ?? []).map((member) => [member.id, member.display_name]),
  );
  const eventRows = eventsResult.data ?? [];

  return {
    defaultDate: date,
    items,
    activeOptions: items.map((item) => ({
      id: item.id,
      name: item.name,
      currency: item.currency,
    })),
    monthTotals: addTotals(eventRows.filter((row) => row.month_key === monthStart)),
    recent: eventRows.map((row): InvestmentEvent => ({
      id: row.id,
      transactionDate: row.transaction_date,
      amount: Number(row.amount),
      currency: row.currency as SupportedCurrency,
      note: row.note,
      investmentName:
        (row.source_id ? investmentNames.get(row.source_id) : null) ?? "Investment",
      memberName: memberNames.get(row.member_id) ?? "Family member",
    })),
  };
}

export async function getLiabilitiesPageData() {
  const profile = await readCurrentProfile();
  if (!profile) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("liabilities")
    .select(
      "id, name, type, original_amount, paid_amount, monthly_payment, currency, due_date, status",
    )
    .eq("family_id", profile.familyId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Liability data could not be loaded.");
  return (data ?? []).map((row): LiabilityItem => ({
    id: row.id,
    name: row.name,
    type: row.type,
    originalAmount: Number(row.original_amount),
    paidAmount: Number(row.paid_amount),
    monthlyPayment: row.monthly_payment === null ? null : Number(row.monthly_payment),
    currency: row.currency as SupportedCurrency,
    dueDate: row.due_date,
    status: row.status,
  }));
}

export async function getRecurringPageData() {
  const profile = await readCurrentProfile();
  if (!profile) return null;
  const supabase = await createClient();
  const [itemsResult, categoriesResult] = await Promise.all([
    supabase
      .from("recurring_transactions")
      .select(
        "id, name, type, amount, currency, frequency, custom_interval_days, next_due_date, category_id",
      )
      .eq("family_id", profile.familyId)
      .eq("active", true)
      .order("next_due_date", { ascending: true }),
    supabase
      .from("expense_categories")
      .select("id, name, type")
      .eq("family_id", profile.familyId)
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

function validSelectedMonth(value: string | undefined, fallback: string) {
  if (!value || !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(value)) return fallback;
  return value;
}

function shiftMonthKey(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function getMonthlyPlanPageData(requestedMonth?: string) {
  const profile = await readCurrentProfile();
  if (!profile) return null;
  const supabase = await createClient();
  const { date, month: currentMonth } = getAlgiersDateValues();
  const selectedMonth = validSelectedMonth(requestedMonth, currentMonth);

  const [plansResult, membersResult, incomeResult, ratesResult] = await Promise.all([
    supabase
      .from("monthly_plans")
      .select("id, month_key, status, current_version_id")
      .eq("family_id", profile.familyId)
      .order("month_key", { ascending: false })
      .limit(36),
    supabase
      .from("profiles")
      .select("id, display_name")
      .eq("family_id", profile.familyId),
    supabase
      .from("income_entries")
      .select("amount, currency")
      .eq("family_id", profile.familyId)
      .eq("income_month", `${selectedMonth}-01`),
    supabase
      .from("exchange_rates")
      .select("currency, rate_to_base, effective_date")
      .eq("family_id", profile.familyId)
      .lte("effective_date", date)
      .order("effective_date", { ascending: false }),
  ]);
  ensureNoQueryErrors(
    [plansResult, membersResult, incomeResult, ratesResult],
    "Monthly plans could not be loaded.",
  );

  const plans = plansResult.data ?? [];
  const planIds = plans.map((plan) => plan.id);
  const versionsResult =
    planIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("monthly_plan_versions")
          .select(
            "id, monthly_plan_id, version_number, reason, essentials_percent, personal_percent, savings_percent, investment_percent, reserve_percent, created_at, created_by",
          )
          .in("monthly_plan_id", planIds)
          .order("version_number", { ascending: false });
  ensureNoQueryErrors([versionsResult], "Monthly plan history could not be loaded.");

  const memberNames = new Map(
    (membersResult.data ?? []).map((member) => [member.id, member.display_name]),
  );
  const versionsByPlan = new Map<string, MonthlyPlanVersion[]>();
  (versionsResult.data ?? []).forEach((version) => {
    const mapped: MonthlyPlanVersion = {
      id: version.id,
      versionNumber: version.version_number,
      reason: version.reason,
      allocation: {
        essentials: Number(version.essentials_percent),
        personal: Number(version.personal_percent),
        savings: Number(version.savings_percent),
        investment: Number(version.investment_percent),
        reserve: Number(version.reserve_percent),
      },
      createdAt: version.created_at,
      createdBy: memberNames.get(version.created_by) ?? "Family member",
    };
    versionsByPlan.set(version.monthly_plan_id, [
      ...(versionsByPlan.get(version.monthly_plan_id) ?? []),
      mapped,
    ]);
  });

  const summaries: MonthlyPlanSummary[] = plans.map((plan) => ({
    id: plan.id,
    month: plan.month_key.slice(0, 7),
    status: plan.status,
    currentVersionId: plan.current_version_id,
    versions: versionsByPlan.get(plan.id) ?? [],
  }));
  const selectedPlan = summaries.find((plan) => plan.month === selectedMonth) ?? null;
  const currentVersion =
    selectedPlan?.versions.find(
      (version) => version.id === selectedPlan.currentVersionId,
    ) ??
    selectedPlan?.versions[0] ??
    null;
  const { rates } = latestRates(ratesResult.data ?? []);
  const incomeValuation = calculateDzdTotal(
    (incomeResult.data ?? []).map((row) => ({
      amount: Number(row.amount),
      currency: row.currency as SupportedCurrency,
    })),
    rates,
  );
  const plannedAmounts =
    currentVersion && incomeValuation.complete
      ? {
          essentials: calculatePlannedAmount(
            incomeValuation.total,
            currentVersion.allocation.essentials,
          ),
          personal: calculatePlannedAmount(
            incomeValuation.total,
            currentVersion.allocation.personal,
          ),
          savings: calculatePlannedAmount(
            incomeValuation.total,
            currentVersion.allocation.savings,
          ),
          investment: calculatePlannedAmount(
            incomeValuation.total,
            currentVersion.allocation.investment,
          ),
          reserve: calculatePlannedAmount(
            incomeValuation.total,
            currentVersion.allocation.reserve,
          ),
        }
      : null;

  return {
    selectedMonth,
    selectedPlan,
    currentVersion,
    plans: summaries,
    familyIncomeDzd: incomeValuation.complete ? incomeValuation.total : null,
    incomeTotals: addTotals(incomeResult.data ?? []),
    missingRateCurrencies: incomeValuation.missingCurrencies,
    plannedAmounts,
    defaultAllocation: {
      essentials: 50,
      personal: 10,
      savings: 20,
      investment: 15,
      reserve: 5,
    } satisfies MonthlyPlanAllocation,
  };
}

function mapSavingsGoal(row: {
  id: string;
  name: string;
  target_amount: number | string;
  current_amount: number | string;
  currency: string;
  target_date: string | null;
  priority: number;
  status: string;
  notes: string | null;
}): SavingsGoal {
  const targetAmount = Number(row.target_amount);
  const currentAmount = Number(row.current_amount);

  return {
    id: row.id,
    name: row.name,
    targetAmount,
    currentAmount,
    currency: row.currency as SupportedCurrency,
    targetDate: row.target_date,
    priority: row.priority,
    status: row.status as SavingsGoal["status"],
    note: row.notes,
    progressPercent:
      targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0,
    remainingAmount: Math.max(targetAmount - currentAmount, 0),
  };
}

export async function getSavingsGoalsPageData() {
  const profile = await readCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { date, monthStart } = getAlgiersDateValues();
  const [goalsResult, contributionsResult, contributionTotalsResult, membersResult] =
    await Promise.all([
      supabase
        .from("savings_goals")
        .select(
          "id, name, target_amount, current_amount, currency, target_date, priority, status, notes",
        )
        .eq("family_id", profile.familyId)
        .neq("status", "cancelled")
        .order("priority")
        .order("created_at"),
      supabase
        .from("financial_transactions")
        .select(
          "id, transaction_date, month_key, amount, currency, source_id, note, member_id",
        )
        .eq("family_id", profile.familyId)
        .eq("type", "saving")
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(24),
      supabase
        .from("financial_transactions")
        .select("month_key, amount, currency")
        .eq("family_id", profile.familyId)
        .eq("type", "saving"),
      supabase
        .from("profiles")
        .select("id, display_name")
        .eq("family_id", profile.familyId),
    ]);
  ensureNoQueryErrors(
    [goalsResult, contributionsResult, contributionTotalsResult, membersResult],
    "Savings goals could not be loaded.",
  );

  const goals = (goalsResult.data ?? []).map(mapSavingsGoal);
  const goalNames = new Map(goals.map((goal) => [goal.id, goal.name]));
  const memberNames = new Map(
    (membersResult.data ?? []).map((member) => [member.id, member.display_name]),
  );
  const contributionRows = contributionsResult.data ?? [];
  const contributionTotalRows = contributionTotalsResult.data ?? [];

  return {
    defaultDate: date,
    goals,
    activeGoals: goals.filter((goal) => goal.status === "active"),
    allTimeTotals: addTotals(contributionTotalRows),
    monthTotals: addTotals(
      contributionTotalRows.filter((row) => row.month_key === monthStart),
    ),
    goalProgressTotals: addTotals(
      goals.map((goal) => ({
        amount: goal.currentAmount,
        currency: goal.currency,
      })),
    ),
    recent: contributionRows.map((row): SavingContribution => ({
      id: row.id,
      transactionDate: row.transaction_date,
      amount: Number(row.amount),
      currency: row.currency as SupportedCurrency,
      note: row.note,
      goalName: row.source_id ? (goalNames.get(row.source_id) ?? null) : null,
      memberName: memberNames.get(row.member_id) ?? "Family member",
    })),
  };
}

export async function getDashboardPageData(requestedMonth?: string) {
  const profile = await readCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { date, month: currentMonth } = getAlgiersDateValues();
  const month = validSelectedMonth(requestedMonth, currentMonth);
  const monthStart = `${month}-01`;
  const trendMonths = Array.from({ length: 6 }, (_, index) =>
    shiftMonthKey(month, index - 5),
  );
  const trendStart = `${trendMonths[0]}-01`;
  const nextMonthStart = `${shiftMonthKey(month, 1)}-01`;
  const [
    incomeResult,
    expensesResult,
    ledgerResult,
    goalsResult,
    plansResult,
    versionsResult,
    ratesResult,
    accountsResult,
    assetsResult,
    investmentsResult,
    liabilitiesResult,
    snapshotsResult,
  ] = await Promise.all([
    supabase
      .from("income_entries")
      .select("income_month, amount, currency")
      .eq("family_id", profile.familyId)
      .gte("income_month", trendStart)
      .lt("income_month", nextMonthStart),
    supabase
      .from("expense_entries")
      .select("month_key, amount, currency, main_category")
      .eq("family_id", profile.familyId)
      .gte("month_key", trendStart)
      .lt("month_key", nextMonthStart),
    supabase
      .from("financial_transactions")
      .select("month_key, amount, currency, type")
      .eq("family_id", profile.familyId)
      .gte("month_key", trendStart)
      .lt("month_key", nextMonthStart)
      .in("type", ["saving", "investment"]),
    supabase
      .from("savings_goals")
      .select(
        "id, name, target_amount, current_amount, currency, target_date, priority, status, notes",
      )
      .eq("family_id", profile.familyId)
      .in("status", ["active", "completed"])
      .order("priority")
      .limit(4),
    supabase
      .from("monthly_plans")
      .select("id, current_version_id")
      .eq("family_id", profile.familyId)
      .eq("month_key", monthStart)
      .limit(1),
    supabase
      .from("monthly_plan_versions")
      .select(
        "id, version_number, essentials_percent, personal_percent, savings_percent, investment_percent, reserve_percent",
      )
      .eq("family_id", profile.familyId),
    supabase
      .from("exchange_rates")
      .select("currency, rate_to_base, effective_date")
      .eq("family_id", profile.familyId)
      .lte("effective_date", date)
      .order("effective_date", { ascending: false }),
    supabase
      .from("accounts")
      .select("current_balance, currency")
      .eq("family_id", profile.familyId)
      .eq("is_active", true),
    supabase
      .from("assets")
      .select("current_value, currency")
      .eq("family_id", profile.familyId)
      .eq("is_active", true),
    supabase
      .from("investments")
      .select("current_value, currency")
      .eq("family_id", profile.familyId),
    supabase
      .from("liabilities")
      .select("original_amount, paid_amount, currency")
      .eq("family_id", profile.familyId)
      .eq("status", "active"),
    supabase
      .from("net_worth_snapshots")
      .select("snapshot_month, net_worth_dzd")
      .eq("family_id", profile.familyId)
      .order("snapshot_month", { ascending: false })
      .limit(12),
  ]);
  ensureNoQueryErrors(
    [
      incomeResult,
      expensesResult,
      ledgerResult,
      goalsResult,
      plansResult,
      versionsResult,
      ratesResult,
      accountsResult,
      assetsResult,
      investmentsResult,
      liabilitiesResult,
      snapshotsResult,
    ],
    "Dashboard totals could not be loaded.",
  );

  const incomeRows = incomeResult.data ?? [];
  const expenseRows = expensesResult.data ?? [];
  const ledgerRows = ledgerResult.data ?? [];
  const selectedIncomeRows = incomeRows.filter((row) =>
    row.income_month.startsWith(month),
  );
  const selectedExpenseRows = expenseRows.filter((row) =>
    row.month_key.startsWith(month),
  );
  const selectedLedgerRows = ledgerRows.filter((row) =>
    row.month_key.startsWith(month),
  );
  const consumptiveExpenses = selectedExpenseRows.filter(
    (row) => row.main_category !== "savings" && row.main_category !== "investment",
  );
  const { rates } = latestRates(ratesResult.data ?? []);
  const missingCurrencies = new Set<"EUR" | "USD">();
  const valuateRows = (rows: Array<{ amount: number | string; currency: string }>) => {
    const valuation = calculateDzdTotal(
      rows.map((row) => ({
        amount: Number(row.amount),
        currency: row.currency as SupportedCurrency,
      })),
      rates,
    );
    valuation.missingCurrencies.forEach((currency) => missingCurrencies.add(currency));
    return valuation;
  };
  const valueRows = (rows: Array<{ amount: number | string; currency: string }>) =>
    valuateRows(rows).total;
  const income = valueRows(selectedIncomeRows);
  const spending = valueRows(consumptiveExpenses);
  const savings = valueRows(selectedLedgerRows.filter((row) => row.type === "saving"));
  const investments = valueRows(
    selectedLedgerRows.filter((row) => row.type === "investment"),
  );
  const flow = calculateMonthlyFlow({
    income,
    expenses: spending,
    savings,
    investments,
  });
  const mainCategoryLabels: Record<string, string> = {
    essentials: "Essentials",
    personal: "Personal",
    reserve: "Reserve",
    liability: "Debt payments",
    other: "Other",
  };
  const expenseBreakdown: DashboardBreakdownItem[] = calculatePercentageBreakdown(
    Object.entries(mainCategoryLabels).map(([key, label]) => ({
      key,
      label,
      amount: valueRows(consumptiveExpenses.filter((row) => row.main_category === key)),
    })),
  );

  const plan = plansResult.data?.[0] ?? null;
  const version = plan?.current_version_id
    ? (versionsResult.data ?? []).find(
        (candidate) => candidate.id === plan.current_version_id,
      )
    : null;
  const actualByPlanKey: Record<keyof MonthlyPlanAllocation, number> = {
    essentials: valueRows(
      selectedExpenseRows.filter((row) => row.main_category === "essentials"),
    ),
    personal: valueRows(
      selectedExpenseRows.filter((row) => row.main_category === "personal"),
    ),
    savings,
    investment: investments,
    reserve: valueRows(
      selectedExpenseRows.filter((row) => row.main_category === "reserve"),
    ),
  };
  const planDefinitions: Array<{
    key: keyof MonthlyPlanAllocation;
    label: string;
    percent: number | null;
  }> = [
    {
      key: "essentials",
      label: "Essentials",
      percent: version ? Number(version.essentials_percent) : null,
    },
    {
      key: "personal",
      label: "Personal",
      percent: version ? Number(version.personal_percent) : null,
    },
    {
      key: "savings",
      label: "Savings",
      percent: version ? Number(version.savings_percent) : null,
    },
    {
      key: "investment",
      label: "Investments",
      percent: version ? Number(version.investment_percent) : null,
    },
    {
      key: "reserve",
      label: "Reserve",
      percent: version ? Number(version.reserve_percent) : null,
    },
  ];
  const planRows: DashboardPlanRow[] = planDefinitions.map((definition) => ({
    key: definition.key,
    label: definition.label,
    planned:
      definition.percent === null
        ? null
        : calculatePlannedAmount(income, definition.percent),
    actual: actualByPlanKey[definition.key],
  }));

  const snapshots = new Map(
    (snapshotsResult.data ?? []).map((snapshot) => [
      snapshot.snapshot_month.slice(0, 7),
      Number(snapshot.net_worth_dzd),
    ]),
  );
  const trends: DashboardTrendPoint[] = trendMonths.map((trendMonth) => {
    const monthIncome = valueRows(
      incomeRows.filter((row) => row.income_month.startsWith(trendMonth)),
    );
    const monthExpenses = valueRows(
      expenseRows.filter(
        (row) =>
          row.month_key.startsWith(trendMonth) &&
          row.main_category !== "savings" &&
          row.main_category !== "investment",
      ),
    );
    const monthLedger = ledgerRows.filter((row) =>
      row.month_key.startsWith(trendMonth),
    );

    return {
      month: trendMonth,
      income: monthIncome,
      spending: monthExpenses,
      savings: valueRows(monthLedger.filter((row) => row.type === "saving")),
      investments: valueRows(monthLedger.filter((row) => row.type === "investment")),
      netWorth: snapshots.get(trendMonth) ?? null,
    };
  });

  const accountsValuation = valuateRows(
    (accountsResult.data ?? []).map((row) => ({
      amount: row.current_balance,
      currency: row.currency,
    })),
  );
  const assetsValuation = valuateRows(
    (assetsResult.data ?? []).map((row) => ({
      amount: row.current_value,
      currency: row.currency,
    })),
  );
  const investmentsValuation = valuateRows(
    (investmentsResult.data ?? []).map((row) => ({
      amount: row.current_value,
      currency: row.currency,
    })),
  );
  const liabilitiesValuation = valuateRows(
    (liabilitiesResult.data ?? []).map((row) => ({
      amount: Math.max(Number(row.original_amount) - Number(row.paid_amount), 0),
      currency: row.currency,
    })),
  );
  const accountsValue = accountsValuation.total;
  const assetsValue = assetsValuation.total;
  const investmentsValue = investmentsValuation.total;
  const liabilitiesValue = liabilitiesValuation.total;
  const liveValuationComplete =
    accountsValuation.complete &&
    assetsValuation.complete &&
    investmentsValuation.complete &&
    liabilitiesValuation.complete;
  const liveNetWorth =
    accountsValue + assetsValue + investmentsValue - liabilitiesValue;
  const assetAllocation: DashboardBreakdownItem[] = calculatePercentageBreakdown([
    { key: "accounts", label: "Accounts", amount: accountsValue },
    { key: "assets", label: "Gold & assets", amount: assetsValue },
    { key: "investments", label: "Investments", amount: investmentsValue },
  ]);
  const snapshotNetWorth = snapshots.get(month) ?? null;
  const displayedNetWorth =
    snapshotNetWorth ??
    (month === currentMonth && liveValuationComplete ? liveNetWorth : null);
  const savingRate = flow.savingRate;
  const averagePlanVariance = calculateAveragePlanVariance(planRows);
  const historicalSnapshots = (snapshotsResult.data ?? []).map((row) =>
    Number(row.net_worth_dzd),
  );
  const netWorthChange =
    historicalSnapshots.length >= 2
      ? historicalSnapshots[0] - historicalSnapshots[1]
      : null;
  const health: DashboardHealthIndicator[] = [
    {
      label: "Cash flow",
      value: flow.remaining >= 0 ? "Positive" : "Negative",
      description:
        flow.remaining >= 0
          ? "Income covers recorded spending, saving, and investing."
          : "Recorded outflow is above income for this month.",
      status: flow.remaining >= 0 ? "positive" : "negative",
    },
    {
      label: "Saving rate",
      value: `${savingRate.toFixed(1)}%`,
      description: "Explicit savings and investment events divided by actual income.",
      status: classifySavingRate(savingRate),
    },
    {
      label: "Plan alignment",
      value:
        averagePlanVariance === null
          ? "No plan"
          : `${(averagePlanVariance * 100).toFixed(0)}% avg. gap`,
      description: "Average absolute variance across planned allocation areas.",
      status: classifyPlanVariance(averagePlanVariance),
    },
    {
      label: "Net-worth direction",
      value:
        netWorthChange === null
          ? "Needs 2 snapshots"
          : netWorthChange >= 0
            ? "Growing"
            : "Declining",
      description: "Change between the two most recent captured month-end values.",
      status:
        netWorthChange === null
          ? "neutral"
          : netWorthChange >= 0
            ? "positive"
            : "warning",
    },
  ];

  return {
    month,
    currentMonth,
    previousMonth: shiftMonthKey(month, -1),
    nextMonth: shiftMonthKey(month, 1),
    incomeTotals: addTotals(selectedIncomeRows),
    spendingTotals: addTotals(consumptiveExpenses),
    savingsTotals: addTotals(selectedLedgerRows.filter((row) => row.type === "saving")),
    investmentTotals: addTotals(
      selectedLedgerRows.filter((row) => row.type === "investment"),
    ),
    income,
    spending,
    savings,
    investments,
    remaining: flow.remaining,
    savingRate,
    netWorth: displayedNetWorth,
    netWorthSource:
      snapshotNetWorth !== null
        ? "captured snapshot"
        : month === currentMonth
          ? "live valuation"
          : null,
    missingRateCurrencies: [...missingCurrencies].sort(),
    planVersion: version?.version_number ?? null,
    planRows,
    expenseBreakdown,
    assetAllocation,
    liabilitiesValue,
    trends,
    health,
    selectedRecordCount:
      selectedIncomeRows.length +
      selectedExpenseRows.length +
      selectedLedgerRows.length,
    goals: (goalsResult.data ?? []).map(mapSavingsGoal),
  };
}

export async function getNetWorthPageData() {
  const profile = await readCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { date, month, monthStart } = getAlgiersDateValues();
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
      .eq("family_id", profile.familyId)
      .eq("is_active", true),
    supabase
      .from("assets")
      .select("id, name, asset_type, currency, current_value")
      .eq("family_id", profile.familyId)
      .eq("is_active", true),
    supabase
      .from("investments")
      .select("id, name, type, currency, current_value")
      .eq("family_id", profile.familyId),
    supabase
      .from("liabilities")
      .select("id, name, type, currency, original_amount, paid_amount, status")
      .eq("family_id", profile.familyId)
      .eq("status", "active"),
    supabase
      .from("exchange_rates")
      .select("currency, rate_to_base, effective_date")
      .eq("family_id", profile.familyId)
      .lte("effective_date", date)
      .order("effective_date", { ascending: false }),
    supabase
      .from("net_worth_snapshots")
      .select(
        "id, snapshot_month, accounts_dzd, assets_dzd, investments_dzd, liabilities_dzd, total_assets_dzd, total_liabilities_dzd, net_worth_dzd, rates_snapshot, captured_at",
      )
      .eq("family_id", profile.familyId)
      .order("snapshot_month", { ascending: false })
      .limit(12),
  ]);
  ensureNoQueryErrors(
    [
      accountsResult,
      assetsResult,
      investmentsResult,
      liabilitiesResult,
      ratesResult,
      snapshotsResult,
    ],
    "Net worth data could not be loaded.",
  );

  const { rates } = latestRates(ratesResult.data ?? []);
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

function validReportYear(value: string | undefined, fallback: string) {
  if (!value || !/^20\d{2}$/.test(value)) return fallback;
  return value;
}

function validReportActivityType(value: string | undefined): ReportActivityType {
  return ["income", "expense", "saving", "investment"].includes(value ?? "")
    ? (value as ReportActivityType)
    : "all";
}

function validReportActivityPeriod(value: string | undefined): ReportActivityPeriod {
  return value === "year" ? "year" : "month";
}

type ReportIncomeSourceRow = {
  id: string;
  income_month: string;
  amount: number | string;
  currency: string;
  note: string | null;
  member_id: string;
};

type ReportExpenseSourceRow = {
  id: string;
  transaction_date: string;
  month_key: string;
  main_category: string;
  amount: number | string;
  currency: string;
  note: string | null;
  member_id: string;
};

type ReportLedgerSourceRow = {
  id: string;
  transaction_date: string;
  month_key: string;
  type: string;
  amount: number | string;
  currency: string;
  note: string | null;
  member_id: string;
};

function buildReportActivityRows({
  expenseRows,
  filters,
  incomeRows,
  ledgerRows,
  memberNames,
  selectedMonth,
}: {
  expenseRows: ReportExpenseSourceRow[];
  filters: ReportActivityFilters;
  incomeRows: ReportIncomeSourceRow[];
  ledgerRows: ReportLedgerSourceRow[];
  memberNames: Map<string, string>;
  selectedMonth: string;
}) {
  const categoryLabels: Record<string, string> = {
    essentials: "Essentials",
    personal: "Personal",
    reserve: "Reserve",
    liability: "Debt payments",
    other: "Other",
    savings: "Savings",
    investment: "Investment",
  };
  const rows: ReportActivityRow[] = [
    ...incomeRows.map((row): ReportActivityRow => ({
      id: row.id,
      date: row.income_month,
      month: row.income_month.slice(0, 7),
      type: "income",
      category: "Income",
      memberId: row.member_id,
      memberName: memberNames.get(row.member_id) ?? "Family member",
      amount: Number(row.amount),
      currency: row.currency as SupportedCurrency,
      note: row.note,
    })),
    ...expenseRows.map((row): ReportActivityRow => ({
      id: row.id,
      date: row.transaction_date,
      month: row.month_key.slice(0, 7),
      type: "expense",
      category: categoryLabels[row.main_category] ?? "Expense",
      memberId: row.member_id,
      memberName: memberNames.get(row.member_id) ?? "Family member",
      amount: Number(row.amount),
      currency: row.currency as SupportedCurrency,
      note: row.note,
    })),
    ...ledgerRows.map((row): ReportActivityRow => ({
      id: row.id,
      date: row.transaction_date,
      month: row.month_key.slice(0, 7),
      type: row.type === "investment" ? "investment" : "saving",
      category: row.type === "investment" ? "Investment" : "Savings",
      memberId: row.member_id,
      memberName: memberNames.get(row.member_id) ?? "Family member",
      amount: Number(row.amount),
      currency: row.currency as SupportedCurrency,
      note: row.note,
    })),
  ];

  return rows
    .filter((row) => filters.period === "year" || row.month === selectedMonth)
    .filter(
      (row) => filters.activityType === "all" || row.type === filters.activityType,
    )
    .filter((row) => !filters.memberId || row.memberId === filters.memberId)
    .sort(
      (left, right) =>
        right.date.localeCompare(left.date) || right.id.localeCompare(left.id),
    );
}

export async function getReportsPageData(
  requestedMonth?: string,
  requestedYear?: string,
  requestedFilters?: {
    activityType?: string;
    memberId?: string;
    period?: string;
  },
) {
  const profile = await readCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { date, month: currentMonth } = getAlgiersDateValues();
  const requestedValidMonth = validSelectedMonth(requestedMonth, currentMonth);
  const selectedYear = validReportYear(requestedYear, requestedValidMonth.slice(0, 4));
  const selectedMonth = `${selectedYear}-${requestedValidMonth.slice(5)}`;
  const yearStart = `${selectedYear}-01-01`;
  const nextYearStart = `${Number(selectedYear) + 1}-01-01`;

  const [
    incomeResult,
    expensesResult,
    ledgerResult,
    plansResult,
    versionsResult,
    ratesResult,
    snapshotsResult,
    membersResult,
  ] = await Promise.all([
    supabase
      .from("income_entries")
      .select("id, income_month, amount, currency, note, member_id")
      .eq("family_id", profile.familyId)
      .gte("income_month", yearStart)
      .lt("income_month", nextYearStart),
    supabase
      .from("expense_entries")
      .select(
        "id, transaction_date, month_key, main_category, amount, currency, note, member_id",
      )
      .eq("family_id", profile.familyId)
      .gte("month_key", yearStart)
      .lt("month_key", nextYearStart),
    supabase
      .from("financial_transactions")
      .select(
        "id, transaction_date, month_key, type, amount, currency, note, member_id",
      )
      .eq("family_id", profile.familyId)
      .in("type", ["saving", "investment"])
      .gte("month_key", yearStart)
      .lt("month_key", nextYearStart),
    supabase
      .from("monthly_plans")
      .select("id, month_key, current_version_id")
      .eq("family_id", profile.familyId)
      .gte("month_key", yearStart)
      .lt("month_key", nextYearStart),
    supabase
      .from("monthly_plan_versions")
      .select(
        "id, version_number, essentials_percent, personal_percent, savings_percent, investment_percent",
      )
      .eq("family_id", profile.familyId),
    supabase
      .from("exchange_rates")
      .select("currency, rate_to_base, effective_date")
      .eq("family_id", profile.familyId)
      .lte("effective_date", date)
      .order("effective_date", { ascending: false }),
    supabase
      .from("net_worth_snapshots")
      .select("snapshot_month, net_worth_dzd")
      .eq("family_id", profile.familyId)
      .gte("snapshot_month", yearStart)
      .lt("snapshot_month", nextYearStart),
    supabase
      .from("profiles")
      .select("id, display_name")
      .eq("family_id", profile.familyId)
      .order("display_name"),
  ]);
  ensureNoQueryErrors(
    [
      incomeResult,
      expensesResult,
      ledgerResult,
      plansResult,
      versionsResult,
      ratesResult,
      snapshotsResult,
      membersResult,
    ],
    "Monthly reports could not be loaded.",
  );

  const members = (membersResult.data ?? []).map((member) => ({
    id: member.id,
    name: member.display_name,
  }));
  const requestedMemberId = requestedFilters?.memberId ?? null;
  const activityFilters: ReportActivityFilters = {
    activityType: validReportActivityType(requestedFilters?.activityType),
    period: validReportActivityPeriod(requestedFilters?.period),
    memberId: members.some((member) => member.id === requestedMemberId)
      ? requestedMemberId
      : null,
  };
  const memberNames = new Map(members.map((member) => [member.id, member.name]));
  const activityRows = buildReportActivityRows({
    incomeRows: incomeResult.data ?? [],
    expenseRows: expensesResult.data ?? [],
    ledgerRows: ledgerResult.data ?? [],
    memberNames,
    selectedMonth,
    filters: activityFilters,
  });
  const { rates } = latestRates(ratesResult.data ?? []);
  const plansByMonth = new Map(
    (plansResult.data ?? []).map((plan) => [
      plan.month_key.slice(0, 7),
      plan.current_version_id,
    ]),
  );
  const versionsById = new Map(
    (versionsResult.data ?? []).map((version) => [version.id, version]),
  );
  const snapshotsByMonth = new Map(
    (snapshotsResult.data ?? []).map((snapshot) => [
      snapshot.snapshot_month.slice(0, 7),
      Number(snapshot.net_worth_dzd),
    ]),
  );
  const missingCurrencies = new Set<string>();
  const valueRows = (rows: Array<{ amount: number | string; currency: string }>) => {
    const valuation = calculateDzdTotal(
      rows.map((row) => ({
        amount: Number(row.amount),
        currency: row.currency as SupportedCurrency,
      })),
      rates,
    );
    valuation.missingCurrencies.forEach((currency) => missingCurrencies.add(currency));
    return valuation.total;
  };

  const months: MonthlyReportRow[] = Array.from({ length: 12 }, (_, index) => {
    const month = `${selectedYear}-${String(index + 1).padStart(2, "0")}`;
    const incomeRows = (incomeResult.data ?? []).filter((row) =>
      row.income_month.startsWith(month),
    );
    const expenseRows = (expensesResult.data ?? []).filter((row) =>
      row.month_key.startsWith(month),
    );
    const ledgerRows = (ledgerResult.data ?? []).filter((row) =>
      row.month_key.startsWith(month),
    );
    const consumptiveRows = expenseRows.filter(
      (row) => row.main_category !== "savings" && row.main_category !== "investment",
    );
    const savingRows = ledgerRows.filter((row) => row.type === "saving");
    const investmentRows = ledgerRows.filter((row) => row.type === "investment");
    const income = valueRows(incomeRows);
    const expenses = valueRows(consumptiveRows);
    const essentials = valueRows(
      expenseRows.filter((row) => row.main_category === "essentials"),
    );
    const personal = valueRows(
      expenseRows.filter((row) => row.main_category === "personal"),
    );
    const savings = valueRows(savingRows);
    const investments = valueRows(investmentRows);
    const flow = calculateMonthlyFlow({
      income,
      expenses,
      savings,
      investments,
    });
    const currentVersionId = plansByMonth.get(month);
    const version = currentVersionId ? versionsById.get(currentVersionId) : undefined;

    return {
      month,
      income,
      expenses,
      essentials,
      personal,
      savings,
      investments,
      remaining: flow.remaining,
      savingRate: flow.savingRate,
      plannedEssentials: version
        ? calculatePlannedAmount(income, Number(version.essentials_percent))
        : null,
      plannedPersonal: version
        ? calculatePlannedAmount(income, Number(version.personal_percent))
        : null,
      plannedSavings: version
        ? calculatePlannedAmount(income, Number(version.savings_percent))
        : null,
      plannedInvestments: version
        ? calculatePlannedAmount(income, Number(version.investment_percent))
        : null,
      planVersion: version?.version_number ?? null,
      netWorth: snapshotsByMonth.get(month) ?? null,
      sourceCounts: {
        income: incomeRows.length,
        expenses: consumptiveRows.length,
        savings: savingRows.length,
        investments: investmentRows.length,
      },
    };
  });
  const selectedSummary =
    months.find((row) => row.month === selectedMonth) ?? months[0];

  return {
    selectedMonth,
    selectedYear,
    selectedSummary,
    months,
    members,
    activityFilters,
    activityRows,
    missingRateCurrencies: [...missingCurrencies].sort(),
    annualTotals: months.reduce(
      (totals, row) => ({
        income: totals.income + row.income,
        expenses: totals.expenses + row.expenses,
        savings: totals.savings + row.savings,
        investments: totals.investments + row.investments,
        remaining: totals.remaining + row.remaining,
      }),
      { income: 0, expenses: 0, savings: 0, investments: 0, remaining: 0 },
    ),
  };
}

export async function getReportActivityExportData({
  activityType,
  memberId,
  month,
  period,
  year,
}: {
  activityType?: string;
  memberId?: string;
  month?: string;
  period?: string;
  year?: string;
}) {
  const profile = await readCurrentProfile();
  if (!profile || profile.mustChangePassword) return null;

  const supabase = await createClient();
  const { month: currentMonth } = getAlgiersDateValues();
  const requestedValidMonth = validSelectedMonth(month, currentMonth);
  const selectedYear = validReportYear(year, requestedValidMonth.slice(0, 4));
  const selectedMonth = `${selectedYear}-${requestedValidMonth.slice(5)}`;
  const yearStart = `${selectedYear}-01-01`;
  const nextYearStart = `${Number(selectedYear) + 1}-01-01`;
  const [incomeResult, expensesResult, ledgerResult, membersResult] = await Promise.all(
    [
      supabase
        .from("income_entries")
        .select("id, income_month, amount, currency, note, member_id")
        .eq("family_id", profile.familyId)
        .gte("income_month", yearStart)
        .lt("income_month", nextYearStart),
      supabase
        .from("expense_entries")
        .select(
          "id, transaction_date, month_key, main_category, amount, currency, note, member_id",
        )
        .eq("family_id", profile.familyId)
        .gte("month_key", yearStart)
        .lt("month_key", nextYearStart),
      supabase
        .from("financial_transactions")
        .select(
          "id, transaction_date, month_key, type, amount, currency, note, member_id",
        )
        .eq("family_id", profile.familyId)
        .in("type", ["saving", "investment"])
        .gte("month_key", yearStart)
        .lt("month_key", nextYearStart),
      supabase
        .from("profiles")
        .select("id, display_name")
        .eq("family_id", profile.familyId),
    ],
  );
  ensureNoQueryErrors(
    [incomeResult, expensesResult, ledgerResult, membersResult],
    "Report export could not be loaded.",
  );

  const members = membersResult.data ?? [];
  const requestedMemberId = memberId ?? null;
  const filters: ReportActivityFilters = {
    activityType: validReportActivityType(activityType),
    period: validReportActivityPeriod(period),
    memberId: members.some((member) => member.id === requestedMemberId)
      ? requestedMemberId
      : null,
  };
  const rows = buildReportActivityRows({
    incomeRows: incomeResult.data ?? [],
    expenseRows: expensesResult.data ?? [],
    ledgerRows: ledgerResult.data ?? [],
    memberNames: new Map(members.map((member) => [member.id, member.display_name])),
    selectedMonth,
    filters,
  });

  return { rows, filters, selectedMonth, selectedYear };
}
