import "server-only";

import { requireHouseholdContext } from "@/lib/auth/household-context";
import { addTotals } from "@/lib/finance/valuation/totals";
import { ensureNoQueryErrors } from "@/lib/finance/read-models/query-errors";
import type { SupportedCurrency } from "@/lib/finance/validation";
import { getAlgiersDateValues } from "@/lib/formatting/date";

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

export type InvestmentEvent = {
  id: string;
  transactionDate: string;
  amount: number;
  currency: SupportedCurrency;
  note: string | null;
  investmentName: string;
  memberName: string;
};

export async function readAssetsPage() {
  const { db: supabase, householdId } = await requireHouseholdContext();
  const { data, error } = await supabase
    .from("assets")
    .select(
      "id, name, asset_type, purchase_value, current_value, currency, purchase_date, notes",
    )
    .eq("family_id", householdId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Asset data could not be loaded.");

  return (data ?? []).map((row): ValuedItem => ({
    id: row.id,
    name: row.name,
    type: row.asset_type,
    purchaseValue: Number(row.purchase_value),
    currentValue: Number(row.current_value),
    currency: row.currency as SupportedCurrency,
    date: row.purchase_date,
    note: row.notes,
  }));
}

export async function getInvestmentPageData() {
  const { db: supabase, householdId } = await requireHouseholdContext();
  const { date, monthStart } = getAlgiersDateValues();
  const [investmentsResult, eventsResult, membersResult] = await Promise.all([
    supabase
      .from("investments")
      .select(
        "id, name, type, purchase_cost, current_value, currency, purchase_date, notes",
      )
      .eq("family_id", householdId)
      .order("created_at", { ascending: false }),
    supabase
      .from("financial_transactions")
      .select(
        "id, transaction_date, month_key, amount, currency, source_id, note, member_id",
      )
      .eq("family_id", householdId)
      .eq("type", "investment")
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("profiles").select("id, display_name").eq("family_id", householdId),
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
