import "server-only";

import { requireHouseholdContext } from "@/lib/auth/household-context";
import { addTotals } from "@/lib/finance/valuation/totals";
import { ensureNoQueryErrors } from "@/lib/finance/read-models/query-errors";
import type { SupportedCurrency } from "@/lib/finance/validation";
import { getAlgiersDateValues } from "@/lib/formatting/date";

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

export async function getIncomePageData() {
  const { db: supabase, householdId, member } = await requireHouseholdContext();
  const { month, monthStart } = getAlgiersDateValues();
  const [membersResult, sourcesResult, monthEntriesResult, recentResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, is_active")
        .eq("family_id", householdId)
        .order("display_name"),
      supabase
        .from("income_sources")
        .select("id, name, owner_member_id")
        .eq("family_id", householdId)
        .eq("is_active", true)
        .order("sort_order")
        .order("name"),
      supabase
        .from("income_entries")
        .select("amount, currency, member_id")
        .eq("family_id", householdId)
        .eq("income_month", monthStart),
      supabase
        .from("income_entries")
        .select("id, income_month, amount, currency, note, source_id, member_id")
        .eq("family_id", householdId)
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
  const activeMemberIds = new Set(
    members.filter((member) => member.is_active).map((member) => member.id),
  );
  const sourceNames = new Map(sources.map((source) => [source.id, source.name]));

  const memberTotals = members.map((member) => ({
    memberId: member.id,
    memberName: member.display_name,
    totals: addTotals(monthEntries.filter((entry) => entry.member_id === member.id)),
  }));

  return {
    canManageMembers: member.role === "owner",
    hasHouseholdMember: members.some((row) => row.id !== member.id),
    defaultMonth: month,
    totals: addTotals(monthEntries),
    memberTotals,
    sources: sources.map((source): IncomeSourceOption => ({
      id: source.id,
      name: source.name,
      memberName: source.owner_member_id
        ? (memberNames.get(source.owner_member_id) ?? null)
        : null,
      available: Boolean(
        source.owner_member_id && activeMemberIds.has(source.owner_member_id),
      ),
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
