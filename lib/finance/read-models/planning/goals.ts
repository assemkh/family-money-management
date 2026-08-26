import "server-only";

import { requireHouseholdContext } from "@/lib/auth/household-context";
import { addTotals } from "@/lib/finance/valuation/totals";
import { ensureNoQueryErrors } from "@/lib/finance/read-models/query-errors";
import type { SupportedCurrency } from "@/lib/finance/validation";
import { getAlgiersDateValues } from "@/lib/formatting/date";

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

export function mapSavingsGoal(row: {
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
  const { db: supabase, householdId } = await requireHouseholdContext();
  const { date, monthStart } = getAlgiersDateValues();
  const [goalsResult, contributionsResult, contributionTotalsResult, membersResult] =
    await Promise.all([
      supabase
        .from("savings_goals")
        .select(
          "id, name, target_amount, current_amount, currency, target_date, priority, status, notes",
        )
        .eq("family_id", householdId)
        .neq("status", "cancelled")
        .order("priority")
        .order("created_at"),
      supabase
        .from("financial_transactions")
        .select(
          "id, transaction_date, month_key, amount, currency, source_id, note, member_id",
        )
        .eq("family_id", householdId)
        .eq("type", "saving")
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(24),
      supabase
        .from("financial_transactions")
        .select("month_key, amount, currency")
        .eq("family_id", householdId)
        .eq("type", "saving"),
      supabase.from("profiles").select("id, display_name").eq("family_id", householdId),
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
