import "server-only";

import { readCurrentProfile } from "@/lib/auth/profile";
import { getAlgiersDateValues } from "@/lib/formatting/date";
import type { SupportedCurrency } from "@/lib/finance/validation";
import { defaultLocale, supportedLocales, type Locale } from "@/lib/i18n/config";
import {
  type CategoryType,
  parseAllocationDefaults,
  parseDashboardPreferences,
  parseFinancialHealthSettings,
  settingKeys,
} from "@/lib/settings/config";
import { createClient } from "@/lib/supabase/server";

export async function getFamilyLocale(familyId: string): Promise<Locale> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("families")
    .select("locale")
    .eq("id", familyId)
    .maybeSingle();
  if (error || !data || !supportedLocales.includes(data.locale as Locale)) {
    return defaultLocale;
  }
  return data.locale as Locale;
}

export async function getSettingsPageData() {
  const profile = await readCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { date } = getAlgiersDateValues();
  const [
    familyResult,
    membersResult,
    settingsResult,
    ratesResult,
    categoriesResult,
    sourcesResult,
  ] = await Promise.all([
    supabase
      .from("families")
      .select("id, name, base_currency, timezone, locale, date_format")
      .eq("id", profile.familyId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select(
        "id, display_name, username, role, is_active, must_change_password, last_login_at",
      )
      .eq("family_id", profile.familyId)
      .order("role")
      .order("display_name"),
    supabase
      .from("settings")
      .select("key, value, updated_at")
      .eq("family_id", profile.familyId)
      .in("key", [
        settingKeys.allocationDefaults,
        settingKeys.dashboardPreferences,
        settingKeys.financialHealth,
      ]),
    supabase
      .from("exchange_rates")
      .select("currency, rate_to_base, effective_date")
      .eq("family_id", profile.familyId)
      .lte("effective_date", date)
      .order("effective_date", { ascending: false }),
    supabase
      .from("expense_categories")
      .select("id, name, type, parent_category_id, is_active, sort_order")
      .eq("family_id", profile.familyId)
      .order("type")
      .order("sort_order")
      .order("name"),
    supabase
      .from("income_sources")
      .select("id, name, owner_member_id, is_active, sort_order")
      .eq("family_id", profile.familyId)
      .order("sort_order")
      .order("name"),
  ]);

  const firstError = [
    familyResult,
    membersResult,
    settingsResult,
    ratesResult,
    categoriesResult,
    sourcesResult,
  ].find((result) => result.error)?.error;
  if (firstError || !familyResult.data) {
    throw new Error("Settings could not be loaded.");
  }

  const settings = new Map(
    (settingsResult.data ?? []).map((setting) => [setting.key, setting]),
  );
  const latestRates = new Map<string, { rate: number; effectiveDate: string }>();
  (ratesResult.data ?? []).forEach((row) => {
    if (!latestRates.has(row.currency)) {
      latestRates.set(row.currency, {
        rate: Number(row.rate_to_base),
        effectiveDate: row.effective_date,
      });
    }
  });

  return {
    canManage: profile.role === "owner",
    currentUserId: profile.id,
    defaultDate: date,
    family: {
      name: familyResult.data.name,
      baseCurrency: familyResult.data.base_currency as SupportedCurrency,
      timezone: familyResult.data.timezone,
      locale: familyResult.data.locale as "en" | "ar",
      dateFormat: familyResult.data.date_format,
    },
    members: (membersResult.data ?? []).map((member) => ({
      id: member.id,
      displayName: member.display_name,
      username: member.username,
      role: member.role as "owner" | "member",
      active: member.is_active,
      mustChangePassword: member.must_change_password,
      lastLoginAt: member.last_login_at,
    })),
    allocationDefaults: parseAllocationDefaults(
      settings.get(settingKeys.allocationDefaults)?.value,
    ),
    dashboardPreferences: parseDashboardPreferences(
      settings.get(settingKeys.dashboardPreferences)?.value,
    ),
    financialHealth: parseFinancialHealthSettings(
      settings.get(settingKeys.financialHealth)?.value,
    ),
    exchangeRates: (["EUR", "USD"] as const).map((currency) => ({
      currency,
      rate: latestRates.get(currency)?.rate ?? null,
      effectiveDate: latestRates.get(currency)?.effectiveDate ?? null,
    })),
    categories: (categoriesResult.data ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type as CategoryType,
      parentCategoryId: category.parent_category_id,
      active: category.is_active,
      sortOrder: category.sort_order,
    })),
    incomeSources: (sourcesResult.data ?? []).map((source) => ({
      id: source.id,
      name: source.name,
      ownerMemberId: source.owner_member_id,
      active: source.is_active,
      sortOrder: source.sort_order,
    })),
    inventory: {
      activeCategories: (categoriesResult.data ?? []).filter((row) => row.is_active)
        .length,
      configuredCategories: (categoriesResult.data ?? []).length,
      activeIncomeSources: (sourcesResult.data ?? []).filter((row) => row.is_active)
        .length,
    },
  };
}
