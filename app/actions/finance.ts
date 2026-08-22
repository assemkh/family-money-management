"use server";

import { revalidatePath } from "next/cache";

import type { FinanceActionState } from "@/lib/finance/action-state";
import {
  accountBalanceSchema,
  expenseEntrySchema,
  incomeEntrySchema,
  manualExchangeRateSchema,
  transferEntrySchema,
} from "@/lib/finance/validation";
import { createClient } from "@/lib/supabase/server";

function invalidFields(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}): FinanceActionState {
  return {
    status: "error",
    message: "Check the highlighted fields and try again.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

async function readActionContext() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, family_id, must_change_password")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile || profile.must_change_password) return null;

  return { profile, supabase };
}

function safeDatabaseMessage(
  error: { message: string } | null,
  fallback: string,
): string {
  const knownMessages = new Map([
    [
      "Account and expense currencies must match",
      "Choose an account with the same currency as the expense.",
    ],
    [
      "Insufficient account balance",
      "The selected account does not have enough money for this operation.",
    ],
    [
      "Cross-currency transfers require a conversion workflow",
      "Choose two accounts that use the same currency.",
    ],
    ["Transfer accounts must be different", "Choose two different accounts."],
    ["Invalid family account", "Choose an active account from your family."],
    ["Invalid family category", "Choose an available family category."],
  ]);

  return knownMessages.get(error?.message ?? "") ?? fallback;
}

export async function createIncomeEntryAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = incomeEntrySchema.safeParse({
    sourceId: formData.get("sourceId"),
    month: formData.get("month"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    note: formData.get("note"),
  });

  if (!result.success) return invalidFields(result.error);

  const context = await readActionContext();

  if (!context) {
    return { status: "error", message: "Your session expired. Sign in again." };
  }

  const { data: source, error: sourceError } = await context.supabase
    .from("income_sources")
    .select("id, owner_member_id")
    .eq("id", result.data.sourceId)
    .eq("family_id", context.profile.family_id)
    .eq("is_active", true)
    .maybeSingle();

  if (sourceError || !source?.owner_member_id) {
    return {
      status: "error",
      message: "That income source is not assigned to an active family member.",
      fieldErrors: { sourceId: ["Choose an assigned income source."] },
    };
  }

  const { error } = await context.supabase.from("income_entries").insert({
    family_id: context.profile.family_id,
    member_id: source.owner_member_id,
    source_id: source.id,
    income_month: result.data.month,
    amount: result.data.amount,
    currency: result.data.currency,
    note: result.data.note,
  });

  if (error) {
    return {
      status: "error",
      message: "The income could not be saved. Your existing data was not changed.",
    };
  }

  revalidatePath("/income");
  revalidatePath("/dashboard");

  return { status: "success", message: "Income saved securely." };
}

export async function createExpenseEntryAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = expenseEntrySchema.safeParse({
    categoryId: formData.get("categoryId"),
    transactionDate: formData.get("transactionDate"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    accountId: formData.get("accountId"),
    note: formData.get("note"),
  });

  if (!result.success) return invalidFields(result.error);

  const context = await readActionContext();

  if (!context) {
    return { status: "error", message: "Your session expired. Sign in again." };
  }

  const { error } = await context.supabase.rpc("record_expense", {
    p_category_id: result.data.categoryId,
    p_transaction_date: result.data.transactionDate,
    p_amount: result.data.amount,
    p_currency: result.data.currency,
    p_payment_account_id: result.data.accountId,
    p_note: result.data.note,
  });

  if (error) {
    return {
      status: "error",
      message: safeDatabaseMessage(
        error,
        "The expense could not be saved. Your existing data was not changed.",
      ),
    };
  }

  revalidatePath("/expenses");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");

  return { status: "success", message: "Expense saved. Add another when ready." };
}

export async function setAccountBalanceAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = accountBalanceSchema.safeParse({
    accountId: formData.get("accountId"),
    balance: formData.get("balance"),
  });

  if (!result.success) return invalidFields(result.error);

  const context = await readActionContext();
  if (!context) {
    return { status: "error", message: "Your session expired. Sign in again." };
  }

  const { error } = await context.supabase.rpc("set_account_balance", {
    p_account_id: result.data.accountId,
    p_balance: result.data.balance,
  });

  if (error) {
    return {
      status: "error",
      message: safeDatabaseMessage(error, "The balance could not be updated."),
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/expenses");
  revalidatePath("/transfers");
  revalidatePath("/dashboard");

  return { status: "success", message: "Account balance updated." };
}

export async function createTransferAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = transferEntrySchema.safeParse({
    fromAccountId: formData.get("fromAccountId"),
    toAccountId: formData.get("toAccountId"),
    transferDate: formData.get("transferDate"),
    amount: formData.get("amount"),
    note: formData.get("note"),
  });

  if (!result.success) return invalidFields(result.error);

  const context = await readActionContext();
  if (!context) {
    return { status: "error", message: "Your session expired. Sign in again." };
  }

  const { error } = await context.supabase.rpc("record_transfer", {
    p_from_account_id: result.data.fromAccountId,
    p_to_account_id: result.data.toAccountId,
    p_transfer_date: result.data.transferDate,
    p_amount: result.data.amount,
    p_note: result.data.note,
  });

  if (error) {
    return {
      status: "error",
      message: safeDatabaseMessage(
        error,
        "The transfer could not be saved. Account balances were not changed.",
      ),
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/transfers");
  revalidatePath("/dashboard");

  return { status: "success", message: "Transfer completed securely." };
}

export async function saveExchangeRateAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = manualExchangeRateSchema.safeParse({
    currency: formData.get("currency"),
    rate: formData.get("rate"),
    effectiveDate: formData.get("effectiveDate"),
  });

  if (!result.success) return invalidFields(result.error);

  const context = await readActionContext();
  if (!context) {
    return { status: "error", message: "Your session expired. Sign in again." };
  }

  const { error } = await context.supabase.from("exchange_rates").upsert(
    {
      family_id: context.profile.family_id,
      currency: result.data.currency,
      rate_to_base: result.data.rate,
      effective_date: result.data.effectiveDate,
    },
    { onConflict: "family_id,currency,effective_date" },
  );

  if (error) {
    return { status: "error", message: "The exchange rate could not be saved." };
  }

  revalidatePath("/accounts");
  revalidatePath("/dashboard");

  return { status: "success", message: `${result.data.currency} rate updated.` };
}
