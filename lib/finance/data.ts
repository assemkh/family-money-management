import "server-only";

import { readCurrentProfile } from "@/lib/auth/profile";
import { getAlgiersDateValues } from "@/lib/formatting/date";
import { convertToDzd, type ExchangeRateMap } from "@/lib/finance/calculations";
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

export async function getMonthlyPlanPageData(requestedMonth?: string) {
  const profile = await readCurrentProfile();
  if (!profile) return null;
  const supabase = await createClient();
  const currentMonth = getAlgiersDateValues().month;
  const selectedMonth = validSelectedMonth(requestedMonth, currentMonth);

  const [plansResult, membersResult] = await Promise.all([
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
  ]);
  ensureNoQueryErrors(
    [plansResult, membersResult],
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

  return {
    selectedMonth,
    selectedPlan,
    currentVersion,
    plans: summaries,
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

export async function getDashboardPageData() {
  const profile = await readCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { month, monthStart } = getAlgiersDateValues();
  const [incomeResult, expensesResult, ledgerResult, goalsResult] = await Promise.all([
    supabase
      .from("income_entries")
      .select("amount, currency")
      .eq("family_id", profile.familyId)
      .eq("income_month", monthStart),
    supabase
      .from("expense_entries")
      .select("amount, currency, main_category")
      .eq("family_id", profile.familyId)
      .eq("month_key", monthStart),
    supabase
      .from("financial_transactions")
      .select("amount, currency, type")
      .eq("family_id", profile.familyId)
      .eq("month_key", monthStart)
      .in("type", ["saving", "investment"]),
    supabase
      .from("savings_goals")
      .select(
        "id, name, target_amount, current_amount, currency, target_date, priority, status, notes",
      )
      .eq("family_id", profile.familyId)
      .in("status", ["active", "completed"])
      .order("priority")
      .limit(3),
  ]);
  ensureNoQueryErrors(
    [incomeResult, expensesResult, ledgerResult, goalsResult],
    "Dashboard totals could not be loaded.",
  );

  const ledger = ledgerResult.data ?? [];
  const consumptiveExpenses = (expensesResult.data ?? []).filter(
    (row) => row.main_category !== "savings" && row.main_category !== "investment",
  );

  return {
    month,
    incomeTotals: addTotals(incomeResult.data ?? []),
    spendingTotals: addTotals(consumptiveExpenses),
    savingsTotals: addTotals(ledger.filter((row) => row.type === "saving")),
    investmentTotals: addTotals(ledger.filter((row) => row.type === "investment")),
    goals: (goalsResult.data ?? []).map(mapSavingsGoal),
  };
}
