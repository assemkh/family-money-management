import "server-only";

import { requireHouseholdContext } from "@/lib/auth/household-context";
import {
  calculateAveragePlanVariance,
  calculateDzdTotal,
  calculateMonthlyFlow,
  calculatePercentageBreakdown,
  calculatePlannedAmount,
  classifyPlanVariance,
  classifySavingRate,
  type FinancialHealthStatus,
} from "@/lib/finance/calculations";
import { readEffectiveRates } from "@/lib/finance/valuation/rates";
import { addTotals } from "@/lib/finance/valuation/totals";
import { ensureNoQueryErrors } from "@/lib/finance/read-models/query-errors";
import type { MonthlyPlanAllocation } from "@/lib/finance/read-models/planning/monthly-plan";
import {
  shiftMonthKey,
  validSelectedMonth,
} from "@/lib/finance/read-models/planning/monthly-plan";
import { mapSavingsGoal } from "@/lib/finance/read-models/planning/goals";
import type { SupportedCurrency } from "@/lib/finance/validation";
import { getAlgiersDateValues } from "@/lib/formatting/date";
import {
  parseDashboardPreferences,
  parseFinancialHealthSettings,
  settingKeys,
} from "@/lib/settings/config";

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

export async function getDashboardPageData(requestedMonth?: string) {
  const { db: supabase, householdId } = await requireHouseholdContext();
  // This read blocks the fan-out because `trendRange` and `defaultMonth` decide the
  // date ranges below. It carries both household keys so the fan-out does not need a
  // second `settings` request for the health thresholds.
  const { data: householdSettings, error: householdSettingsError } = await supabase
    .from("settings")
    .select("key, value")
    .eq("family_id", householdId)
    .in("key", [settingKeys.dashboardPreferences, settingKeys.financialHealth]);
  if (householdSettingsError) {
    throw new Error("Dashboard preferences could not be loaded.");
  }
  const settingsByKey = new Map(
    (householdSettings ?? []).map((row) => [row.key, row.value]),
  );
  const preferences = parseDashboardPreferences(
    settingsByKey.get(settingKeys.dashboardPreferences),
  );
  const { month: currentMonth } = getAlgiersDateValues();
  const defaultMonth =
    preferences.defaultMonth === "previous"
      ? shiftMonthKey(currentMonth, -1)
      : currentMonth;
  const month = validSelectedMonth(requestedMonth, defaultMonth);
  const monthStart = `${month}-01`;
  const trendMonths = Array.from({ length: preferences.trendRange }, (_, index) =>
    shiftMonthKey(month, index - (preferences.trendRange - 1)),
  );
  const trendStart = `${trendMonths[0]}-01`;
  const nextMonthStart = `${shiftMonthKey(month, 1)}-01`;
  const [
    incomeResult,
    expensesResult,
    ledgerResult,
    goalsResult,
    plansResult,
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
      .eq("family_id", householdId)
      .gte("income_month", trendStart)
      .lt("income_month", nextMonthStart),
    supabase
      .from("expense_entries")
      .select("month_key, amount, currency, main_category")
      .eq("family_id", householdId)
      .gte("month_key", trendStart)
      .lt("month_key", nextMonthStart),
    supabase
      .from("financial_transactions")
      .select("month_key, amount, currency, type")
      .eq("family_id", householdId)
      .gte("month_key", trendStart)
      .lt("month_key", nextMonthStart)
      .in("type", ["saving", "investment"]),
    supabase
      .from("savings_goals")
      .select(
        "id, name, target_amount, current_amount, currency, target_date, priority, status, notes",
      )
      .eq("family_id", householdId)
      .in("status", ["active", "completed"])
      .order("priority")
      .limit(4),
    // The embed returns only the plan's current Revision. Reading the whole
    // `monthly_plan_versions` table and finding one row in memory grew without bound
    // as a Household accumulated revisions.
    supabase
      .from("monthly_plans")
      .select(
        "id, current_version_id, monthly_plan_versions!monthly_plans_current_version_fk(id, version_number, essentials_percent, personal_percent, savings_percent, investment_percent, reserve_percent)",
      )
      .eq("family_id", householdId)
      .eq("month_key", monthStart)
      .limit(1),
    readEffectiveRates({ db: supabase, householdId }),
    supabase
      .from("accounts")
      .select("current_balance, currency")
      .eq("family_id", householdId)
      .eq("is_active", true),
    supabase
      .from("assets")
      .select("current_value, currency")
      .eq("family_id", householdId)
      .eq("is_active", true),
    supabase
      .from("investments")
      .select("current_value, currency")
      .eq("family_id", householdId),
    supabase
      .from("liabilities")
      .select("original_amount, paid_amount, currency")
      .eq("family_id", householdId)
      .eq("status", "active"),
    supabase
      .from("net_worth_snapshots")
      .select("snapshot_month, net_worth_dzd")
      .eq("family_id", householdId)
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
  const { rates } = ratesResult;
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
  // PostgREST returns the embedded Revision as an object for this to-one composite
  // foreign key, but the generated types widen it to an array. Accept both rather
  // than assert one.
  const embedded = plan?.monthly_plan_versions ?? null;
  const version = (Array.isArray(embedded) ? (embedded[0] ?? null) : embedded) ?? null;
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
  const healthSettings = parseFinancialHealthSettings(
    settingsByKey.get(settingKeys.financialHealth),
  );
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
      status: classifySavingRate(savingRate, healthSettings),
    },
    {
      label: "Plan alignment",
      value:
        averagePlanVariance === null
          ? "No plan"
          : `${(averagePlanVariance * 100).toFixed(0)}% avg. gap`,
      description: "Average absolute variance across planned allocation areas.",
      status: classifyPlanVariance(averagePlanVariance, healthSettings),
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
    preferences,
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
