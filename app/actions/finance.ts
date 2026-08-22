"use server";

import { revalidatePath } from "next/cache";

import type { FinanceActionState } from "@/lib/finance/action-state";
import { expenseEntrySchema, incomeEntrySchema } from "@/lib/finance/validation";
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

  const categoryPromise = context.supabase
    .from("expense_categories")
    .select("id, type")
    .eq("id", result.data.categoryId)
    .eq("family_id", context.profile.family_id)
    .eq("is_active", true)
    .maybeSingle();

  const accountPromise = result.data.accountId
    ? context.supabase
        .from("accounts")
        .select("id")
        .eq("id", result.data.accountId)
        .eq("family_id", context.profile.family_id)
        .eq("is_active", true)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [{ data: category, error: categoryError }, accountResult] = await Promise.all([
    categoryPromise,
    accountPromise,
  ]);

  if (categoryError || !category) {
    return {
      status: "error",
      message: "Choose an available family category.",
      fieldErrors: { categoryId: ["Choose an available category."] },
    };
  }

  if (result.data.accountId && (accountResult.error || !accountResult.data)) {
    return {
      status: "error",
      message: "Choose an available family account.",
      fieldErrors: { accountId: ["Choose an available account."] },
    };
  }

  const { error } = await context.supabase.from("expense_entries").insert({
    family_id: context.profile.family_id,
    member_id: context.profile.id,
    transaction_date: result.data.transactionDate,
    main_category: category.type,
    subcategory_id: category.id,
    amount: result.data.amount,
    currency: result.data.currency,
    payment_account_id: accountResult.data?.id ?? null,
    note: result.data.note,
  });

  if (error) {
    return {
      status: "error",
      message: "The expense could not be saved. Your existing data was not changed.",
    };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");

  return { status: "success", message: "Expense saved. Add another when ready." };
}
