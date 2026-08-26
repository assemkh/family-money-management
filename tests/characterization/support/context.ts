import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getAlgiersDateValues } from "@/lib/formatting/date";

/** Fixed identifiers from `scripts/characterization/seed.sql`. */
export const FIXTURE = {
  householdId: "20000000-0000-4000-8000-000000000001",
  ownerId: "20000000-0000-4000-8000-000000000002",
  memberId: "20000000-0000-4000-8000-000000000003",
} as const;

/**
 * Characterization runs against the service-role client scoped to the fixture
 * Household. Every read model already filters by `family_id` explicitly, so the rows
 * returned are the same ones an authenticated Member would see. These tests exist to
 * prove the *transformations* are unchanged; Household isolation is proven separately
 * by the pgTAP allow-and-deny suite.
 */
export function characterizationClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "Characterization tests need local Supabase. Run `npm run test:read-models`.",
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
}

function monthKey(offset: number) {
  const { month } = getAlgiersDateValues();
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 - offset, 1))
    .toISOString()
    .slice(0, 7);
}

const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/**
 * Rewrites absolute dates to month-relative tokens so a committed snapshot stays
 * valid next month. `2026-08-15` in the current month becomes `<M+0>-15`, and a full
 * timestamp collapses to `<timestamp>` because its clock component changes every run.
 */
export function normalizeDates<T>(value: T): T {
  const months = new Map<string, string>();
  for (let offset = -24; offset <= 36; offset += 1) {
    months.set(monthKey(offset), `<M${offset > 0 ? "-" : "+"}${Math.abs(offset)}>`);
  }

  const rewrite = (input: unknown): unknown => {
    if (typeof input === "string") {
      if (TIMESTAMP.test(input)) return "<timestamp>";
      const month = input.slice(0, 7);
      const token = months.get(month);
      return token ? `${token}${input.slice(7)}` : input;
    }
    if (Array.isArray(input)) return input.map(rewrite);
    if (input && typeof input === "object") {
      return Object.fromEntries(
        Object.entries(input as Record<string, unknown>).map(([key, item]) => [
          key,
          rewrite(item),
        ]),
      );
    }
    return input;
  };

  return rewrite(value) as T;
}
