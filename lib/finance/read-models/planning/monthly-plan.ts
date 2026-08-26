import "server-only";

import { requireHouseholdContext } from "@/lib/auth/household-context";
import { calculateDzdTotal, calculatePlannedAmount } from "@/lib/finance/calculations";
import { readEffectiveRates } from "@/lib/finance/valuation/rates";
import { addTotals } from "@/lib/finance/valuation/totals";
import { ensureNoQueryErrors } from "@/lib/finance/read-models/query-errors";
import type { SupportedCurrency } from "@/lib/finance/validation";
import { getAlgiersDateValues } from "@/lib/formatting/date";
import { parseAllocationDefaults, settingKeys } from "@/lib/settings/config";

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

export function validSelectedMonth(value: string | undefined, fallback: string) {
  if (!value || !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(value)) return fallback;
  return value;
}

export function shiftMonthKey(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function getMonthlyPlanPageData(requestedMonth?: string) {
  const { db: supabase, householdId } = await requireHouseholdContext();
  const { month: currentMonth } = getAlgiersDateValues();
  const selectedMonth = validSelectedMonth(requestedMonth, currentMonth);

  const [plansResult, membersResult, incomeResult, ratesResult, defaultsResult] =
    await Promise.all([
      supabase
        .from("monthly_plans")
        .select("id, month_key, status, current_version_id")
        .eq("family_id", householdId)
        .order("month_key", { ascending: false })
        .limit(36),
      supabase.from("profiles").select("id, display_name").eq("family_id", householdId),
      supabase
        .from("income_entries")
        .select("amount, currency")
        .eq("family_id", householdId)
        .eq("income_month", `${selectedMonth}-01`),
      readEffectiveRates({ db: supabase, householdId }),
      supabase
        .from("settings")
        .select("value")
        .eq("family_id", householdId)
        .eq("key", settingKeys.allocationDefaults)
        .maybeSingle(),
    ]);
  ensureNoQueryErrors(
    [plansResult, membersResult, incomeResult, defaultsResult],
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
  const { rates } = ratesResult;
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
    defaultAllocation: parseAllocationDefaults(defaultsResult.data?.value),
  };
}
