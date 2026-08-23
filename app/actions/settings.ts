"use server";

import { revalidatePath } from "next/cache";

import type { FinanceActionState } from "@/lib/finance/action-state";
import { settingKeys } from "@/lib/settings/config";
import {
  allocationDefaultsSchema,
  familySettingsSchema,
  financialHealthSettingsSchema,
} from "@/lib/settings/validation";
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
  value: Record<string, number>,
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
