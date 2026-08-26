import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { readAuthState } from "@/lib/auth/session";
import {
  defaultLocale,
  getDirection,
  getMessages,
  supportedLocales,
} from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/types";
import { getRequestClient } from "@/lib/supabase/server";

export type HouseholdMember = {
  readonly id: string;
  readonly displayName: string;
  readonly username: string;
  readonly role: "owner" | "member";
  readonly mustChangePassword: boolean;
};

export type HouseholdContext = {
  /** Verified Supabase Auth user id. */
  readonly userId: string;
  /** The Household this request acts within. Never accepted as input. */
  readonly householdId: string;
  readonly member: HouseholdMember;
  readonly locale: Locale;
  readonly direction: "ltr" | "rtl";
  readonly messages: Messages;
  /** RLS-scoped client bound to this request's cookies. */
  readonly db: Awaited<ReturnType<typeof getRequestClient>>;
};

type EmbeddedFamily = { locale?: unknown } | Array<{ locale?: unknown }> | null;

function resolveLocale(families: EmbeddedFamily): Locale {
  const row = Array.isArray(families) ? families[0] : families;
  const value = row?.locale;
  return supportedLocales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}

/**
 * Resolves the verified identity, Household, role, locale, messages, and RLS-scoped
 * client for this request. Memoized with React `cache()`, so every consumer in one
 * render or one Server Action shares a single resolution. Nothing is cached across
 * requests — see docs/adr/0002-authenticated-rendering-and-cache-safety.md.
 *
 * Returns null when the caller is anonymous, when the session cannot be verified, or
 * when no profile row is readable for the verified user. Callers that need to tell
 * those apart read `readAuthState()` first; it is memoized and costs no extra work.
 */
export const readHouseholdContext = cache(
  async (): Promise<HouseholdContext | null> => {
    const authState = await readAuthState();
    if (authState.status !== "authenticated") return null;

    const userId = authState.claims.sub;
    if (typeof userId !== "string") return null;

    const db = await getRequestClient();

    // One read resolves the Member and the Household locale together. Splitting it
    // costs a second sequential round trip on every authenticated render.
    const { data, error } = await db
      .from("profiles")
      .select(
        "id, family_id, display_name, username, role, must_change_password, families(locale)",
      )
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;

    const locale = resolveLocale(data.families as EmbeddedFamily);

    return {
      userId: data.id,
      householdId: data.family_id,
      member: {
        id: data.id,
        displayName: data.display_name,
        username: data.username,
        role: data.role,
        mustChangePassword: data.must_change_password,
      },
      locale,
      direction: getDirection(locale),
      messages: getMessages(locale),
      db,
    };
  },
);

/**
 * Render-path variant. Redirects to /login when the caller cannot be resolved and to
 * /change-password when the Member must replace their password, so a page never
 * renders against a partial context.
 */
export async function requireHouseholdContext(): Promise<HouseholdContext> {
  const context = await readHouseholdContext();

  if (!context) redirect("/login");
  if (context.member.mustChangePassword) redirect("/change-password");

  return context;
}
