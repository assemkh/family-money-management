import "server-only";

import { requireHouseholdContext } from "@/lib/auth/household-context";
import { ensureNoQueryErrors } from "@/lib/finance/read-models/query-errors";
import type { AccountOption } from "@/lib/finance/read-models/net-worth/accounts";
import type { SupportedCurrency } from "@/lib/finance/validation";
import { getAlgiersDateValues } from "@/lib/formatting/date";

export type RecentTransfer = {
  id: string;
  transferDate: string;
  amount: number;
  currency: SupportedCurrency;
  note: string | null;
  fromAccountName: string;
  toAccountName: string;
};

export async function getTransfersPageData() {
  const { db: supabase, householdId } = await requireHouseholdContext();
  const { date } = getAlgiersDateValues();
  const [accountsResult, transfersResult] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, currency, current_balance")
      .eq("family_id", householdId)
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("transfers")
      .select(
        "id, transfer_date, from_account_id, to_account_id, amount, currency, note",
      )
      .eq("family_id", householdId)
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
