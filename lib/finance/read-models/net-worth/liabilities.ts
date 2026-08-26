import "server-only";

import { requireHouseholdContext } from "@/lib/auth/household-context";
import type { SupportedCurrency } from "@/lib/finance/validation";

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

export async function getLiabilitiesPageData() {
  const { db: supabase, householdId } = await requireHouseholdContext();
  const { data, error } = await supabase
    .from("liabilities")
    .select(
      "id, name, type, original_amount, paid_amount, monthly_payment, currency, due_date, status",
    )
    .eq("family_id", householdId)
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
