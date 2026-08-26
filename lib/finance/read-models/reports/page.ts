import "server-only";

import {
  readHouseholdContext,
  requireHouseholdContext,
} from "@/lib/auth/household-context";
import {
  calculateDzdTotal,
  calculateMonthlyFlow,
  calculatePlannedAmount,
} from "@/lib/finance/calculations";
import { readEffectiveRates } from "@/lib/finance/valuation/rates";
import { ensureNoQueryErrors } from "@/lib/finance/read-models/query-errors";
import { validSelectedMonth } from "@/lib/finance/read-models/planning/monthly-plan";
import type { SupportedCurrency } from "@/lib/finance/validation";
import { getAlgiersDateValues } from "@/lib/formatting/date";

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
  const { db: supabase, householdId } = await requireHouseholdContext();
  const { month: currentMonth } = getAlgiersDateValues();
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
    ratesResult,
    snapshotsResult,
    membersResult,
  ] = await Promise.all([
    supabase
      .from("income_entries")
      .select("id, income_month, amount, currency, note, member_id")
      .eq("family_id", householdId)
      .gte("income_month", yearStart)
      .lt("income_month", nextYearStart),
    supabase
      .from("expense_entries")
      .select(
        "id, transaction_date, month_key, main_category, amount, currency, note, member_id",
      )
      .eq("family_id", householdId)
      .gte("month_key", yearStart)
      .lt("month_key", nextYearStart),
    supabase
      .from("financial_transactions")
      .select(
        "id, transaction_date, month_key, type, amount, currency, note, member_id",
      )
      .eq("family_id", householdId)
      .in("type", ["saving", "investment"])
      .gte("month_key", yearStart)
      .lt("month_key", nextYearStart),
    // Each plan carries its own current Revision. Reading every Revision in the
    // Household and indexing them in memory grew without bound as revisions
    // accumulated, while this returns at most one row per month in range.
    supabase
      .from("monthly_plans")
      .select(
        "id, month_key, current_version_id, monthly_plan_versions!monthly_plans_current_version_fk(id, version_number, essentials_percent, personal_percent, savings_percent, investment_percent)",
      )
      .eq("family_id", householdId)
      .gte("month_key", yearStart)
      .lt("month_key", nextYearStart),
    readEffectiveRates({ db: supabase, householdId }),
    supabase
      .from("net_worth_snapshots")
      .select("snapshot_month, net_worth_dzd")
      .eq("family_id", householdId)
      .gte("snapshot_month", yearStart)
      .lt("snapshot_month", nextYearStart),
    supabase
      .from("profiles")
      .select("id, display_name")
      .eq("family_id", householdId)
      .order("display_name"),
  ]);
  ensureNoQueryErrors(
    [
      incomeResult,
      expensesResult,
      ledgerResult,
      plansResult,
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
  const { rates } = ratesResult;
  // PostgREST returns the embedded Revision as an object for this to-one composite
  // foreign key, but the generated types widen it to an array. Accept both.
  const plansByMonth = new Map(
    (plansResult.data ?? []).map((plan) => {
      const embedded = plan.monthly_plan_versions ?? null;
      const version = Array.isArray(embedded) ? (embedded[0] ?? null) : embedded;
      return [plan.month_key.slice(0, 7), version] as const;
    }),
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
    const version = plansByMonth.get(month) ?? undefined;

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
  // The export is a Route Handler: it answers 401 rather than redirecting, so it uses
  // the non-throwing variant and keeps its own must-change-password refusal.
  const context = await readHouseholdContext();
  if (!context || context.member.mustChangePassword) return null;

  const { db: supabase, householdId } = context;
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
        .eq("family_id", householdId)
        .gte("income_month", yearStart)
        .lt("income_month", nextYearStart),
      supabase
        .from("expense_entries")
        .select(
          "id, transaction_date, month_key, main_category, amount, currency, note, member_id",
        )
        .eq("family_id", householdId)
        .gte("month_key", yearStart)
        .lt("month_key", nextYearStart),
      supabase
        .from("financial_transactions")
        .select(
          "id, transaction_date, month_key, type, amount, currency, note, member_id",
        )
        .eq("family_id", householdId)
        .in("type", ["saving", "investment"])
        .gte("month_key", yearStart)
        .lt("month_key", nextYearStart),
      supabase.from("profiles").select("id, display_name").eq("family_id", householdId),
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
