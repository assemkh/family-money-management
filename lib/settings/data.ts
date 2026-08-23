import "server-only";

import { readCurrentProfile } from "@/lib/auth/profile";
import { getAlgiersDateValues } from "@/lib/formatting/date";
import type { SupportedCurrency } from "@/lib/finance/validation";
import { defaultLocale, supportedLocales, type Locale } from "@/lib/i18n/config";
import {
  parseAllocationDefaults,
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
      .select("id, display_name, username, role, last_login_at")
      .eq("family_id", profile.familyId)
      .order("role")
      .order("display_name"),
    supabase
      .from("settings")
      .select("key, value, updated_at")
      .eq("family_id", profile.familyId)
      .in("key", [settingKeys.allocationDefaults, settingKeys.financialHealth]),
    supabase
      .from("exchange_rates")
      .select("currency, rate_to_base, effective_date")
      .eq("family_id", profile.familyId)
      .lte("effective_date", date)
      .order("effective_date", { ascending: false }),
    supabase.from("expense_categories").select("id, family_id, is_active"),
    supabase
      .from("income_sources")
      .select("id, is_active")
      .eq("family_id", profile.familyId),
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
      lastLoginAt: member.last_login_at,
    })),
    allocationDefaults: parseAllocationDefaults(
      settings.get(settingKeys.allocationDefaults)?.value,
    ),
    financialHealth: parseFinancialHealthSettings(
      settings.get(settingKeys.financialHealth)?.value,
    ),
    exchangeRates: (["EUR", "USD"] as const).map((currency) => ({
      currency,
      rate: latestRates.get(currency)?.rate ?? null,
      effectiveDate: latestRates.get(currency)?.effectiveDate ?? null,
    })),
    inventory: {
      activeCategories: (categoriesResult.data ?? []).filter((row) => row.is_active)
        .length,
      customCategories: (categoriesResult.data ?? []).filter(
        (row) => row.family_id === profile.familyId,
      ).length,
      activeIncomeSources: (sourcesResult.data ?? []).filter((row) => row.is_active)
        .length,
    },
  };
}
