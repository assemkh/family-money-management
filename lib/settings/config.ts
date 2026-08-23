import {
  defaultFinancialHealthThresholds,
  type FinancialHealthThresholds,
} from "@/lib/finance/calculations";

export const settingKeys = {
  allocationDefaults: "allocation.defaults",
  dashboardPreferences: "dashboard.preferences",
  financialHealth: "financial_health.thresholds",
} as const;

export const categoryTypes = [
  "essentials",
  "personal",
  "savings",
  "investment",
  "reserve",
  "liability",
  "other",
] as const;

export type CategoryType = (typeof categoryTypes)[number];

export type ManagedCategory = {
  id: string;
  name: string;
  type: CategoryType;
  parentCategoryId: string | null;
  active: boolean;
  sortOrder: number;
};

export type ManagedIncomeSource = {
  id: string;
  name: string;
  ownerMemberId: string | null;
  active: boolean;
  sortOrder: number;
};

export type SettingsMemberOption = {
  active: boolean;
  id: string;
  displayName: string;
};

export type DashboardPreferences = {
  kpiMode: "compact" | "full";
  defaultMonth: "current" | "previous";
  trendRange: 3 | 6 | 12;
  showHealth: boolean;
  showPlan: boolean;
  showBreakdowns: boolean;
  showNetWorth: boolean;
  showGoals: boolean;
};

export type AllocationDefaults = {
  essentials: number;
  personal: number;
  savings: number;
  investment: number;
  reserve: number;
};

export type FinancialHealthSettings = FinancialHealthThresholds & {
  essentialsWarningRatio: number;
  positiveInvestmentRate: number;
  debtWarningRatio: number;
  goalProgressTarget: number;
};

export const defaultAllocationDefaults: AllocationDefaults = Object.freeze({
  essentials: 50,
  personal: 10,
  savings: 20,
  investment: 15,
  reserve: 5,
});

export const defaultFinancialHealthSettings: FinancialHealthSettings = Object.freeze({
  ...defaultFinancialHealthThresholds,
  essentialsWarningRatio: 60,
  positiveInvestmentRate: 10,
  debtWarningRatio: 30,
  goalProgressTarget: 75,
});

export const defaultDashboardPreferences: DashboardPreferences = Object.freeze({
  kpiMode: "full",
  defaultMonth: "current",
  trendRange: 6,
  showHealth: true,
  showPlan: true,
  showBreakdowns: true,
  showNetWorth: true,
  showGoals: true,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseAllocationDefaults(value: unknown): AllocationDefaults {
  if (!isRecord(value)) return { ...defaultAllocationDefaults };

  const parsed = {
    essentials: finiteNumber(value.essentials, defaultAllocationDefaults.essentials),
    personal: finiteNumber(value.personal, defaultAllocationDefaults.personal),
    savings: finiteNumber(value.savings, defaultAllocationDefaults.savings),
    investment: finiteNumber(value.investment, defaultAllocationDefaults.investment),
    reserve: finiteNumber(value.reserve, defaultAllocationDefaults.reserve),
  };
  const total = Object.values(parsed).reduce((sum, amount) => sum + amount, 0);
  const valuesAreValid = Object.values(parsed).every(
    (amount) => amount >= 0 && amount <= 100,
  );

  return valuesAreValid && Math.abs(total - 100) < 0.000001
    ? parsed
    : { ...defaultAllocationDefaults };
}

export function parseFinancialHealthSettings(value: unknown): FinancialHealthSettings {
  if (!isRecord(value)) return { ...defaultFinancialHealthSettings };

  const parsed = {
    positiveSavingRate: finiteNumber(
      value.positiveSavingRate,
      defaultFinancialHealthSettings.positiveSavingRate,
    ),
    neutralSavingRate: finiteNumber(
      value.neutralSavingRate,
      defaultFinancialHealthSettings.neutralSavingRate,
    ),
    positivePlanVariance: finiteNumber(
      value.positivePlanVariance,
      defaultFinancialHealthSettings.positivePlanVariance,
    ),
    warningPlanVariance: finiteNumber(
      value.warningPlanVariance,
      defaultFinancialHealthSettings.warningPlanVariance,
    ),
    essentialsWarningRatio: finiteNumber(
      value.essentialsWarningRatio,
      defaultFinancialHealthSettings.essentialsWarningRatio,
    ),
    positiveInvestmentRate: finiteNumber(
      value.positiveInvestmentRate,
      defaultFinancialHealthSettings.positiveInvestmentRate,
    ),
    debtWarningRatio: finiteNumber(
      value.debtWarningRatio,
      defaultFinancialHealthSettings.debtWarningRatio,
    ),
    goalProgressTarget: finiteNumber(
      value.goalProgressTarget,
      defaultFinancialHealthSettings.goalProgressTarget,
    ),
  };

  const percentageValues = [
    parsed.positiveSavingRate,
    parsed.neutralSavingRate,
    parsed.essentialsWarningRatio,
    parsed.positiveInvestmentRate,
    parsed.debtWarningRatio,
    parsed.goalProgressTarget,
  ];
  const validPercentages = percentageValues.every(
    (number) => number >= 0 && number <= 100,
  );
  const validVariance =
    parsed.positivePlanVariance >= 0 &&
    parsed.warningPlanVariance <= 1 &&
    parsed.positivePlanVariance <= parsed.warningPlanVariance;
  const validSavingBands = parsed.neutralSavingRate <= parsed.positiveSavingRate;

  return validPercentages && validVariance && validSavingBands
    ? parsed
    : { ...defaultFinancialHealthSettings };
}

export function parseDashboardPreferences(value: unknown): DashboardPreferences {
  if (!isRecord(value)) return { ...defaultDashboardPreferences };

  return {
    kpiMode:
      value.kpiMode === "compact" || value.kpiMode === "full"
        ? value.kpiMode
        : defaultDashboardPreferences.kpiMode,
    defaultMonth:
      value.defaultMonth === "current" || value.defaultMonth === "previous"
        ? value.defaultMonth
        : defaultDashboardPreferences.defaultMonth,
    trendRange:
      value.trendRange === 3 || value.trendRange === 6 || value.trendRange === 12
        ? value.trendRange
        : defaultDashboardPreferences.trendRange,
    showHealth:
      typeof value.showHealth === "boolean"
        ? value.showHealth
        : defaultDashboardPreferences.showHealth,
    showPlan:
      typeof value.showPlan === "boolean"
        ? value.showPlan
        : defaultDashboardPreferences.showPlan,
    showBreakdowns:
      typeof value.showBreakdowns === "boolean"
        ? value.showBreakdowns
        : defaultDashboardPreferences.showBreakdowns,
    showNetWorth:
      typeof value.showNetWorth === "boolean"
        ? value.showNetWorth
        : defaultDashboardPreferences.showNetWorth,
    showGoals:
      typeof value.showGoals === "boolean"
        ? value.showGoals
        : defaultDashboardPreferences.showGoals,
  };
}
