"use server";

import { revalidatePath } from "next/cache";

import type { FinanceActionState } from "@/lib/finance/action-state";
import { settingKeys } from "@/lib/settings/config";
import {
  allocationDefaultsSchema,
  categorySettingsSchema,
  categoryUpdateSchema,
  dashboardPreferencesSchema,
  familySettingsSchema,
  financialHealthSettingsSchema,
  incomeSourceSettingsSchema,
  incomeSourceUpdateSchema,
  managementStatusSchema,
  memberPasswordResetSchema,
  memberProfileUpdateSchema,
} from "@/lib/settings/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function invalidFields(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}): FinanceActionState {
  return {
    status: "error",
    message: "Check the highlighted settings and try again.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

async function readOwnerContext() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || typeof userId !== "string") return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, family_id, role, must_change_password")
    .eq("id", userId)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.must_change_password ||
    profile.role !== "owner"
  ) {
    return null;
  }

  return { profile, supabase };
}

async function saveFamilySetting(
  context: NonNullable<Awaited<ReturnType<typeof readOwnerContext>>>,
  key: string,
  value: Record<string, boolean | number | string>,
) {
  return context.supabase.from("settings").upsert(
    {
      family_id: context.profile.family_id,
      key,
      value,
    },
    { onConflict: "family_id,key" },
  );
}

function configurationError(
  error: { code?: string; message?: string } | null,
  fallback: string,
) {
  if (error?.code === "23505") return "That name already exists in this family.";
  return fallback;
}

async function validateCategoryParent(
  context: NonNullable<Awaited<ReturnType<typeof readOwnerContext>>>,
  parentCategoryId: string | null,
  type: string,
  categoryId?: string,
) {
  if (!parentCategoryId) return null;
  if (parentCategoryId === categoryId) return "A category cannot be its own parent.";

  const { data, error } = await context.supabase
    .from("expense_categories")
    .select("id, type, parent_category_id, is_active")
    .eq("id", parentCategoryId)
    .eq("family_id", context.profile.family_id)
    .maybeSingle();
  if (error || !data || !data.is_active || data.parent_category_id) {
    return "Choose an active top-level category as the parent.";
  }
  if (data.type !== type)
    return "A child category must use the same type as its parent.";
  return null;
}

async function validateSourceMember(
  context: NonNullable<Awaited<ReturnType<typeof readOwnerContext>>>,
  memberId: string | null,
) {
  if (!memberId) return true;
  const { data, error } = await context.supabase
    .from("profiles")
    .select("id")
    .eq("id", memberId)
    .eq("family_id", context.profile.family_id)
    .eq("is_active", true)
    .maybeSingle();
  return !error && Boolean(data);
}

export async function updateFamilySettingsAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = familySettingsSchema.safeParse({
    name: formData.get("name"),
    baseCurrency: formData.get("baseCurrency"),
    timezone: formData.get("timezone"),
    locale: formData.get("locale"),
    dateFormat: formData.get("dateFormat"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readOwnerContext();
  if (!context) {
    return {
      status: "error",
      message: "Only the family owner can change household settings.",
    };
  }

  const { data, error } = await context.supabase
    .from("families")
    .update({
      name: result.data.name,
      base_currency: result.data.baseCurrency,
      timezone: result.data.timezone,
      locale: result.data.locale,
      date_format: result.data.dateFormat,
    })
    .eq("id", context.profile.family_id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      status: "error",
      message:
        "Family preferences could not be saved. Existing settings are unchanged.",
    };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { status: "success", message: "Family preferences saved." };
}

export async function updateAllocationDefaultsAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = allocationDefaultsSchema.safeParse({
    essentials: formData.get("essentials"),
    personal: formData.get("personal"),
    savings: formData.get("savings"),
    investment: formData.get("investment"),
    reserve: formData.get("reserve"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readOwnerContext();
  if (!context) {
    return {
      status: "error",
      message: "Only the family owner can change planning defaults.",
    };
  }

  const { error } = await saveFamilySetting(
    context,
    settingKeys.allocationDefaults,
    result.data,
  );
  if (error) {
    return {
      status: "error",
      message: "Planning defaults could not be saved. Existing plans were not changed.",
    };
  }

  revalidatePath("/settings");
  revalidatePath("/monthly-plan");
  return {
    status: "success",
    message: "New-month allocation defaults saved. Historical plans remain unchanged.",
  };
}

export async function updateFinancialHealthSettingsAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = financialHealthSettingsSchema.safeParse({
    positiveSavingRate: formData.get("positiveSavingRate"),
    neutralSavingRate: formData.get("neutralSavingRate"),
    positivePlanVariancePercent: formData.get("positivePlanVariancePercent"),
    warningPlanVariancePercent: formData.get("warningPlanVariancePercent"),
    essentialsWarningRatio: formData.get("essentialsWarningRatio"),
    positiveInvestmentRate: formData.get("positiveInvestmentRate"),
    debtWarningRatio: formData.get("debtWarningRatio"),
    goalProgressTarget: formData.get("goalProgressTarget"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readOwnerContext();
  if (!context) {
    return {
      status: "error",
      message: "Only the family owner can change health thresholds.",
    };
  }

  const { positivePlanVariancePercent, warningPlanVariancePercent, ...percentages } =
    result.data;
  const { error } = await saveFamilySetting(context, settingKeys.financialHealth, {
    ...percentages,
    positivePlanVariance: positivePlanVariancePercent / 100,
    warningPlanVariance: warningPlanVariancePercent / 100,
  });
  if (error) {
    return {
      status: "error",
      message: "Health thresholds could not be saved. Existing settings are unchanged.",
    };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { status: "success", message: "Financial-health thresholds saved." };
}

export async function updateDashboardPreferencesAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = dashboardPreferencesSchema.safeParse({
    kpiMode: formData.get("kpiMode"),
    defaultMonth: formData.get("defaultMonth"),
    trendRange: formData.get("trendRange"),
    showHealth: formData.has("showHealth"),
    showPlan: formData.has("showPlan"),
    showBreakdowns: formData.has("showBreakdowns"),
    showNetWorth: formData.has("showNetWorth"),
    showGoals: formData.has("showGoals"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readOwnerContext();
  if (!context) {
    return {
      status: "error",
      message: "Only the family owner can change dashboard preferences.",
    };
  }

  const { error } = await saveFamilySetting(
    context,
    settingKeys.dashboardPreferences,
    result.data,
  );
  if (error) {
    return {
      status: "error",
      message: "Dashboard preferences could not be saved.",
    };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { status: "success", message: "Dashboard preferences saved." };
}

export async function createExpenseCategoryAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = categorySettingsSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    parentCategoryId: formData.get("parentCategoryId"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readOwnerContext();
  if (!context) {
    return { status: "error", message: "Only the family owner can add categories." };
  }
  const parentError = await validateCategoryParent(
    context,
    result.data.parentCategoryId,
    result.data.type,
  );
  if (parentError) {
    return {
      status: "error",
      message: parentError,
      fieldErrors: { parentCategoryId: [parentError] },
    };
  }

  const { error } = await context.supabase.from("expense_categories").insert({
    family_id: context.profile.family_id,
    name: result.data.name,
    type: result.data.type,
    parent_category_id: result.data.parentCategoryId,
    sort_order: result.data.sortOrder,
  });
  if (error) {
    return {
      status: "error",
      message: configurationError(error, "The category could not be added."),
    };
  }

  revalidatePath("/settings");
  revalidatePath("/expenses");
  revalidatePath("/recurring");
  return { status: "success", message: "Category added and ready for new entries." };
}

export async function updateExpenseCategoryAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = categoryUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    type: formData.get("type"),
    parentCategoryId: formData.get("parentCategoryId"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readOwnerContext();
  if (!context) {
    return { status: "error", message: "Only the family owner can edit categories." };
  }
  const parentError = await validateCategoryParent(
    context,
    result.data.parentCategoryId,
    result.data.type,
    result.data.id,
  );
  if (parentError) {
    return {
      status: "error",
      message: parentError,
      fieldErrors: { parentCategoryId: [parentError] },
    };
  }

  const { data: children, error: childrenError } = await context.supabase
    .from("expense_categories")
    .select("type")
    .eq("family_id", context.profile.family_id)
    .eq("parent_category_id", result.data.id);
  if (childrenError) {
    return {
      status: "error",
      message: "Category dependencies could not be checked.",
    };
  }
  if (children?.some((child) => child.type !== result.data.type)) {
    return {
      status: "error",
      message: "Move or update child categories before changing this category type.",
      fieldErrors: {
        type: ["This type must continue to match every child category."],
      },
    };
  }

  const { data, error } = await context.supabase
    .from("expense_categories")
    .update({
      name: result.data.name,
      type: result.data.type,
      parent_category_id: result.data.parentCategoryId,
      sort_order: result.data.sortOrder,
    })
    .eq("id", result.data.id)
    .eq("family_id", context.profile.family_id)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return {
      status: "error",
      message: configurationError(error, "The category could not be updated."),
    };
  }

  revalidatePath("/settings");
  revalidatePath("/expenses");
  revalidatePath("/recurring");
  return { status: "success", message: "Category details saved." };
}

export async function setExpenseCategoryActiveAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = managementStatusSchema.safeParse({
    id: formData.get("id"),
    active: formData.get("active"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readOwnerContext();
  if (!context) {
    return {
      status: "error",
      message: "Only the family owner can archive categories.",
    };
  }

  if (!result.data.active) {
    const { count, error: childError } = await context.supabase
      .from("expense_categories")
      .select("id", { count: "exact", head: true })
      .eq("family_id", context.profile.family_id)
      .eq("parent_category_id", result.data.id)
      .eq("is_active", true);
    if (childError) {
      return {
        status: "error",
        message: "Category dependencies could not be checked.",
      };
    }
    if ((count ?? 0) > 0) {
      return {
        status: "error",
        message: "Archive or move the active child categories first.",
      };
    }
  } else {
    const { data: category } = await context.supabase
      .from("expense_categories")
      .select("parent_category_id")
      .eq("id", result.data.id)
      .eq("family_id", context.profile.family_id)
      .maybeSingle();
    if (category?.parent_category_id) {
      const { data: parent } = await context.supabase
        .from("expense_categories")
        .select("is_active")
        .eq("id", category.parent_category_id)
        .eq("family_id", context.profile.family_id)
        .maybeSingle();
      if (!parent?.is_active) {
        return { status: "error", message: "Restore the parent category first." };
      }
    }
  }

  const { data, error } = await context.supabase
    .from("expense_categories")
    .update({ is_active: result.data.active })
    .eq("id", result.data.id)
    .eq("family_id", context.profile.family_id)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return { status: "error", message: "The category status could not be changed." };
  }

  revalidatePath("/settings");
  revalidatePath("/expenses");
  revalidatePath("/recurring");
  return {
    status: "success",
    message: result.data.active
      ? "Category restored for new entries."
      : "Category archived. Historical entries remain unchanged.",
  };
}

export async function createIncomeSourceAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = incomeSourceSettingsSchema.safeParse({
    name: formData.get("name"),
    ownerMemberId: formData.get("ownerMemberId"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readOwnerContext();
  if (!context) {
    return {
      status: "error",
      message: "Only the family owner can add income sources.",
    };
  }
  if (!(await validateSourceMember(context, result.data.ownerMemberId))) {
    return {
      status: "error",
      message: "Choose a member from this family.",
      fieldErrors: { ownerMemberId: ["Choose a valid family member."] },
    };
  }

  const { error } = await context.supabase.from("income_sources").insert({
    family_id: context.profile.family_id,
    name: result.data.name,
    owner_member_id: result.data.ownerMemberId,
    sort_order: result.data.sortOrder,
  });
  if (error) {
    return {
      status: "error",
      message: configurationError(error, "The income source could not be added."),
    };
  }

  revalidatePath("/settings");
  revalidatePath("/income");
  return { status: "success", message: "Income source added." };
}

export async function updateIncomeSourceAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = incomeSourceUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    ownerMemberId: formData.get("ownerMemberId"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readOwnerContext();
  if (!context) {
    return {
      status: "error",
      message: "Only the family owner can edit income sources.",
    };
  }
  if (!(await validateSourceMember(context, result.data.ownerMemberId))) {
    return {
      status: "error",
      message: "Choose a member from this family.",
      fieldErrors: { ownerMemberId: ["Choose a valid family member."] },
    };
  }

  const { data, error } = await context.supabase
    .from("income_sources")
    .update({
      name: result.data.name,
      owner_member_id: result.data.ownerMemberId,
      sort_order: result.data.sortOrder,
    })
    .eq("id", result.data.id)
    .eq("family_id", context.profile.family_id)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return {
      status: "error",
      message: configurationError(error, "The income source could not be updated."),
    };
  }

  revalidatePath("/settings");
  revalidatePath("/income");
  return { status: "success", message: "Income source details saved." };
}

export async function setIncomeSourceActiveAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = managementStatusSchema.safeParse({
    id: formData.get("id"),
    active: formData.get("active"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readOwnerContext();
  if (!context) {
    return {
      status: "error",
      message: "Only the family owner can archive income sources.",
    };
  }
  const { data, error } = await context.supabase
    .from("income_sources")
    .update({ is_active: result.data.active })
    .eq("id", result.data.id)
    .eq("family_id", context.profile.family_id)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return {
      status: "error",
      message: "The income source status could not be changed.",
    };
  }

  revalidatePath("/settings");
  revalidatePath("/income");
  return {
    status: "success",
    message: result.data.active
      ? "Income source restored."
      : "Income source archived. Historical income remains unchanged.",
  };
}

export async function updateMemberProfileAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = memberProfileUpdateSchema.safeParse({
    id: formData.get("id"),
    displayName: formData.get("displayName"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readOwnerContext();
  if (!context) {
    return { status: "error", message: "Only the family owner can edit members." };
  }

  const { data, error } = await context.supabase
    .from("profiles")
    .update({ display_name: result.data.displayName })
    .eq("id", result.data.id)
    .eq("family_id", context.profile.family_id)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return { status: "error", message: "The member profile could not be updated." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { status: "success", message: "Member display name saved." };
}

export async function setMemberActiveAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = managementStatusSchema.safeParse({
    id: formData.get("id"),
    active: formData.get("active"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readOwnerContext();
  if (!context) {
    return { status: "error", message: "Only the family owner can change access." };
  }

  const { data: member, error: memberError } = await context.supabase
    .from("profiles")
    .select("id, display_name, role, is_active")
    .eq("id", result.data.id)
    .eq("family_id", context.profile.family_id)
    .maybeSingle();
  if (memberError || !member || member.role === "owner") {
    return { status: "error", message: "Choose a non-owner family member." };
  }
  if (member.is_active === result.data.active) {
    return {
      status: "success",
      message: result.data.active
        ? "Member access is already active."
        : "Member access is already paused.",
    };
  }

  const admin = createAdminClient();

  if (!result.data.active) {
    const { data, error } = await context.supabase
      .from("profiles")
      .update({ is_active: false })
      .eq("id", member.id)
      .eq("family_id", context.profile.family_id)
      .select("id")
      .maybeSingle();
    if (error || !data) {
      return { status: "error", message: "Member access could not be paused." };
    }

    const { error: banError } = await admin.auth.admin.updateUserById(member.id, {
      ban_duration: "876000h",
    });
    if (banError) {
      await context.supabase
        .from("profiles")
        .update({ is_active: true })
        .eq("id", member.id)
        .eq("family_id", context.profile.family_id);
      return {
        status: "error",
        message: "Auth access could not be paused, so the member stayed active.",
      };
    }
  } else {
    const { error: unbanError } = await admin.auth.admin.updateUserById(member.id, {
      ban_duration: "none",
    });
    if (unbanError) {
      return { status: "error", message: "Member sign-in could not be restored." };
    }

    const { data, error } = await context.supabase
      .from("profiles")
      .update({ is_active: true })
      .eq("id", member.id)
      .eq("family_id", context.profile.family_id)
      .select("id")
      .maybeSingle();
    if (error || !data) {
      await admin.auth.admin.updateUserById(member.id, {
        ban_duration: "876000h",
      });
      return {
        status: "error",
        message: "Database access could not be restored, so sign-in remains paused.",
      };
    }
  }

  revalidatePath("/settings");
  revalidatePath("/income");
  return {
    status: "success",
    message: result.data.active
      ? `${member.display_name} can sign in again.`
      : `${member.display_name} is paused and family data access is blocked.`,
  };
}

export async function resetMemberPasswordAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = memberPasswordResetSchema.safeParse({
    id: formData.get("id"),
    temporaryPassword: formData.get("temporaryPassword"),
  });
  if (!result.success) return invalidFields(result.error);

  const context = await readOwnerContext();
  if (!context) {
    return { status: "error", message: "Only the family owner can reset passwords." };
  }

  const { data: member, error: memberError } = await context.supabase
    .from("profiles")
    .select("id, role, is_active, must_change_password")
    .eq("id", result.data.id)
    .eq("family_id", context.profile.family_id)
    .maybeSingle();
  if (memberError || !member || member.role === "owner" || !member.is_active) {
    return { status: "error", message: "Choose an active non-owner family member." };
  }

  const admin = createAdminClient();
  const { error: profileError } = await admin
    .from("profiles")
    .update({ must_change_password: true })
    .eq("id", member.id)
    .eq("family_id", context.profile.family_id);
  if (profileError) {
    return { status: "error", message: "The password reset could not be prepared." };
  }

  const { error: passwordError } = await admin.auth.admin.updateUserById(member.id, {
    password: result.data.temporaryPassword,
  });
  if (passwordError) {
    await admin
      .from("profiles")
      .update({ must_change_password: member.must_change_password })
      .eq("id", member.id)
      .eq("family_id", context.profile.family_id);
    return { status: "error", message: "The temporary password was not accepted." };
  }

  revalidatePath("/settings");
  return {
    status: "success",
    message: "Temporary password saved. The member must replace it at next sign-in.",
  };
}

export async function revokeOtherSessionsAction(
  _previousState: FinanceActionState,
  _formData: FormData,
): Promise<FinanceActionState> {
  void _previousState;
  void _formData;
  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return { status: "error", message: "Your session expired. Sign in again." };
  }

  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) {
    return { status: "error", message: "Other sessions could not be revoked." };
  }
  return { status: "success", message: "Other signed-in sessions were revoked." };
}
