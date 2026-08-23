"use server";

import { revalidatePath } from "next/cache";

import type { FinanceActionState } from "@/lib/finance/action-state";
import {
  accountBalanceSchema,
  assetEntrySchema,
  expenseEntrySchema,
  householdMemberSchema,
  incomeEntrySchema,
  investmentEntrySchema,
  investmentEventSchema,
  liabilityEntrySchema,
  manualExchangeRateSchema,
  monthlyPlanSchema,
  netWorthSnapshotSchema,
  recurringEntrySchema,
  savingContributionSchema,
  savingsGoalSchema,
  savingsGoalStatusSchema,
  transferEntrySchema,
} from "@/lib/finance/validation";
import { createAdminClient } from "@/lib/supabase/admin";
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
    .select("id, family_id, role, must_change_password")
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
    [
      "Monthly allocation must total exactly 100 percent",
      "The monthly allocation must total exactly 100% before it can be activated.",
    ],
    [
      "Goal and contribution currencies must match",
      "Use the same currency as the selected savings goal.",
    ],
    ["Savings goal is not active", "Reactivate this goal before adding money."],
    ["Invalid family savings goal", "Choose an available family savings goal."],
    [
      "Investment and event currencies must match",
      "Use the same currency as the selected investment.",
    ],
    ["Invalid family investment", "Choose an investment from your family."],
    [
      "Only the current month can be captured",
      "Historical snapshots are locked. Capture the current month instead.",
    ],
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

  const { data: sourceMember, error: sourceMemberError } = await context.supabase
    .from("profiles")
    .select("id")
    .eq("id", source.owner_member_id)
    .eq("family_id", context.profile.family_id)
    .eq("is_active", true)
    .maybeSingle();
  if (sourceMemberError || !sourceMember) {
    return {
      status: "error",
      message: "That income source is assigned to a paused family member.",
      fieldErrors: { sourceId: ["Restore the assigned member first."] },
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

export async function createHouseholdMemberAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = householdMemberSchema.safeParse({
    displayName: formData.get("displayName"),
    username: formData.get("username"),
    email: formData.get("email"),
    temporaryPassword: formData.get("temporaryPassword"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readActionContext();
  if (!context)
    return { status: "error", message: "Your session expired. Sign in again." };
  if (context.profile.role !== "owner") {
    return { status: "error", message: "Only the household owner can add a member." };
  }

  const admin = createAdminClient();
  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email: result.data.email,
    password: result.data.temporaryPassword,
    email_confirm: true,
    user_metadata: { display_name: result.data.displayName },
    app_metadata: { account_type: "household_member" },
  });

  if (authError || !created.user) {
    return {
      status: "error",
      message: authError?.message.toLowerCase().includes("already")
        ? "That email already has an account."
        : "The family member account could not be created.",
    };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    family_id: context.profile.family_id,
    display_name: result.data.displayName,
    username: result.data.username,
    role: "member",
    must_change_password: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return {
      status: "error",
      message: profileError.message.includes("profiles_username")
        ? "That username is already in use."
        : "The family profile could not be created.",
    };
  }

  const { error: assignmentError } = await admin
    .from("income_sources")
    .update({ owner_member_id: created.user.id })
    .eq("family_id", context.profile.family_id)
    .is("owner_member_id", null)
    .ilike("name", "Wife Source%");

  if (assignmentError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { status: "error", message: "Income sources could not be assigned safely." };
  }

  revalidatePath("/income");
  revalidatePath("/settings");
  return {
    status: "success",
    message: `${result.data.displayName} can now sign in by username or email.`,
  };
}

export async function createAssetAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = assetEntrySchema.safeParse({
    name: formData.get("name"),
    assetType: formData.get("assetType"),
    purchaseValue: formData.get("purchaseValue"),
    currentValue: formData.get("currentValue"),
    currency: formData.get("currency"),
    purchaseDate: formData.get("purchaseDate"),
    note: formData.get("note"),
  });
  if (!result.success) return invalidFields(result.error);
  const context = await readActionContext();
  if (!context)
    return { status: "error", message: "Your session expired. Sign in again." };
  const { error } = await context.supabase.from("assets").insert({
    family_id: context.profile.family_id,
    asset_type: result.data.assetType,
    name: result.data.name,
    purchase_value: result.data.purchaseValue,
    current_value: result.data.currentValue,
    currency: result.data.currency,
    purchase_date: result.data.purchaseDate,
    notes: result.data.note,
  });
  if (error) return { status: "error", message: "The asset could not be saved." };
  revalidatePath("/assets");
  revalidatePath("/dashboard");
  return { status: "success", message: "Asset saved." };
}

export async function createInvestmentAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = investmentEntrySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    purchaseValue: formData.get("purchaseValue"),
    currentValue: formData.get("currentValue"),
    currency: formData.get("currency"),
    purchaseDate: formData.get("purchaseDate"),
    note: formData.get("note"),
  });
  if (!result.success) return invalidFields(result.error);
  const context = await readActionContext();
  if (!context)
    return { status: "error", message: "Your session expired. Sign in again." };
  const { error } = await context.supabase.from("investments").insert({
    family_id: context.profile.family_id,
    name: result.data.name,
    type: result.data.type,
    purchase_cost: result.data.purchaseValue,
    current_value: result.data.currentValue,
    currency: result.data.currency,
    purchase_date: result.data.purchaseDate,
    notes: result.data.note,
  });
  if (error) return { status: "error", message: "The investment could not be saved." };
  revalidatePath("/investments");
  revalidatePath("/dashboard");
  return { status: "success", message: "Investment saved." };
}

export async function createLiabilityAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = liabilityEntrySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    originalAmount: formData.get("originalAmount"),
    paidAmount: formData.get("paidAmount"),
    monthlyPayment: formData.get("monthlyPayment"),
    currency: formData.get("currency"),
    dueDate: formData.get("dueDate"),
    note: formData.get("note"),
  });
  if (!result.success) return invalidFields(result.error);
  const context = await readActionContext();
  if (!context)
    return { status: "error", message: "Your session expired. Sign in again." };
  const paid = Number(result.data.paidAmount);
  const original = Number(result.data.originalAmount);
  const { error } = await context.supabase.from("liabilities").insert({
    family_id: context.profile.family_id,
    name: result.data.name,
    type: result.data.type,
    original_amount: result.data.originalAmount,
    paid_amount: result.data.paidAmount,
    monthly_payment: result.data.monthlyPayment,
    currency: result.data.currency,
    due_date: result.data.dueDate,
    status: paid >= original ? "paid" : "active",
    notes: result.data.note,
  });
  if (error) return { status: "error", message: "The liability could not be saved." };
  revalidatePath("/liabilities");
  revalidatePath("/dashboard");
  return { status: "success", message: "Liability saved." };
}

export async function createRecurringAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = recurringEntrySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    frequency: formData.get("frequency"),
    customIntervalDays: formData.get("customIntervalDays"),
    nextDueDate: formData.get("nextDueDate"),
    note: formData.get("note"),
  });
  if (!result.success) return invalidFields(result.error);
  const context = await readActionContext();
  if (!context)
    return { status: "error", message: "Your session expired. Sign in again." };
  if (result.data.categoryId) {
    const { data: category } = await context.supabase
      .from("expense_categories")
      .select("id")
      .eq("id", result.data.categoryId)
      .eq("family_id", context.profile.family_id)
      .eq("is_active", true)
      .maybeSingle();
    if (!category)
      return { status: "error", message: "Choose an active family category." };
  }
  const { error } = await context.supabase.from("recurring_transactions").insert({
    family_id: context.profile.family_id,
    name: result.data.name,
    type: result.data.type,
    category_id: result.data.categoryId,
    amount: result.data.amount,
    currency: result.data.currency,
    frequency: result.data.frequency,
    custom_interval_days:
      result.data.frequency === "custom" ? result.data.customIntervalDays : null,
    next_due_date: result.data.nextDueDate,
    active: true,
    notes: result.data.note,
  });
  if (error)
    return { status: "error", message: "The recurring item could not be saved." };
  revalidatePath("/recurring");
  return { status: "success", message: "Recurring item saved." };
}

export async function saveMonthlyPlanAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = monthlyPlanSchema.safeParse({
    month: formData.get("month"),
    reason: formData.get("reason"),
    essentialsPercent: formData.get("essentialsPercent"),
    personalPercent: formData.get("personalPercent"),
    savingsPercent: formData.get("savingsPercent"),
    investmentPercent: formData.get("investmentPercent"),
    reservePercent: formData.get("reservePercent"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readActionContext();
  if (!context)
    return { status: "error", message: "Your session expired. Sign in again." };

  const { error } = await context.supabase.rpc("save_monthly_plan", {
    p_month_key: result.data.month,
    p_reason: result.data.reason,
    p_essentials_percent: result.data.essentialsPercent,
    p_personal_percent: result.data.personalPercent,
    p_savings_percent: result.data.savingsPercent,
    p_investment_percent: result.data.investmentPercent,
    p_reserve_percent: result.data.reservePercent,
  });

  if (error) {
    return {
      status: "error",
      message: safeDatabaseMessage(
        error,
        "The monthly plan could not be saved. The active version was not changed.",
      ),
    };
  }

  revalidatePath("/monthly-plan");
  revalidatePath("/dashboard");
  return { status: "success", message: "Monthly plan activated as a new version." };
}

export async function createSavingsGoalAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = savingsGoalSchema.safeParse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    currency: formData.get("currency"),
    targetDate: formData.get("targetDate"),
    priority: formData.get("priority"),
    note: formData.get("note"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readActionContext();
  if (!context)
    return { status: "error", message: "Your session expired. Sign in again." };

  const { error } = await context.supabase.rpc("create_savings_goal", {
    p_name: result.data.name,
    p_target_amount: result.data.targetAmount,
    p_currency: result.data.currency,
    p_target_date: result.data.targetDate,
    p_priority: result.data.priority,
    p_notes: result.data.note,
  });

  if (error) {
    return {
      status: "error",
      message: safeDatabaseMessage(error, "The savings goal could not be created."),
    };
  }

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { status: "success", message: "Savings goal created." };
}

export async function recordSavingContributionAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = savingContributionSchema.safeParse({
    goalId: formData.get("goalId"),
    transactionDate: formData.get("transactionDate"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    note: formData.get("note"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readActionContext();
  if (!context)
    return { status: "error", message: "Your session expired. Sign in again." };

  const { error } = await context.supabase.rpc("record_saving_contribution", {
    p_transaction_date: result.data.transactionDate,
    p_amount: result.data.amount,
    p_currency: result.data.currency,
    p_goal_id: result.data.goalId,
    p_note: result.data.note,
  });

  if (error) {
    return {
      status: "error",
      message: safeDatabaseMessage(
        error,
        "The savings contribution could not be saved. Goal progress was not changed.",
      ),
    };
  }

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return {
    status: "success",
    message: "Savings recorded and goal progress updated.",
  };
}

export async function setSavingsGoalStatusAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = savingsGoalStatusSchema.safeParse({
    goalId: formData.get("goalId"),
    status: formData.get("status"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readActionContext();
  if (!context)
    return { status: "error", message: "Your session expired. Sign in again." };

  const { error } = await context.supabase.rpc("set_savings_goal_status", {
    p_goal_id: result.data.goalId,
    p_status: result.data.status,
  });

  if (error) {
    return {
      status: "error",
      message: safeDatabaseMessage(error, "The savings goal could not be updated."),
    };
  }

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return {
    status: "success",
    message:
      result.data.status === "cancelled"
        ? "Goal archived. Its savings history remains intact."
        : result.data.status === "paused"
          ? "Goal paused."
          : "Goal reactivated.",
  };
}

export async function recordInvestmentEventAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = investmentEventSchema.safeParse({
    investmentId: formData.get("investmentId"),
    transactionDate: formData.get("transactionDate"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    note: formData.get("note"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readActionContext();
  if (!context)
    return { status: "error", message: "Your session expired. Sign in again." };

  const { error } = await context.supabase.rpc("record_investment_event", {
    p_investment_id: result.data.investmentId,
    p_transaction_date: result.data.transactionDate,
    p_amount: result.data.amount,
    p_currency: result.data.currency,
    p_note: result.data.note,
  });

  if (error) {
    return {
      status: "error",
      message: safeDatabaseMessage(
        error,
        "The investment event could not be saved. The position was not changed.",
      ),
    };
  }

  revalidatePath("/investments");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/net-worth");
  return {
    status: "success",
    message: "Investment recorded and position value updated.",
  };
}

export async function captureNetWorthSnapshotAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = netWorthSnapshotSchema.safeParse({
    month: formData.get("month"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readActionContext();
  if (!context)
    return { status: "error", message: "Your session expired. Sign in again." };

  const { error } = await context.supabase.rpc("capture_net_worth_snapshot", {
    p_snapshot_month: result.data.month,
  });

  if (error) {
    const missingRate = error.message.startsWith("Missing current exchange rate for:");
    return {
      status: "error",
      message: missingRate
        ? `${error.message}. Add the missing manual rate from Accounts first.`
        : safeDatabaseMessage(error, "The net-worth snapshot could not be captured."),
    };
  }

  revalidatePath("/net-worth");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return { status: "success", message: "Current-month net worth captured." };
}
