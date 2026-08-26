import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { TestCredentials } from "./support/credentials";
import {
  authArtifactRoot,
  credentialFile,
  performanceArtifactRoot,
} from "./support/paths";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Local Supabase test environment is incomplete.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
}

async function dataOrThrow<T>(
  result: PromiseLike<{ data: T; error: { message: string } | null }>,
  operation: string,
): Promise<NonNullable<T>> {
  const { data, error } = await result;
  if (error) throw new Error(`${operation}: ${error.message}`);
  // Supabase mutations intentionally return null unless `.select()` is added;
  // callers that consume data use `.single()` and therefore receive a row.
  return data as NonNullable<T>;
}

function cleanupLocalFixtures() {
  execFileSync(
    "npx",
    [
      "supabase",
      "db",
      "query",
      "--local",
      "--file",
      "scripts/performance/cleanup-fixtures.sql",
    ],
    { cwd: process.cwd(), stdio: ["ignore", "ignore", "pipe"] },
  );
}

async function createAuthUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
  accountType: "household_member" | "household_owner",
) {
  const { data, error } = await supabase.auth.admin.createUser({
    app_metadata: { account_type: accountType },
    email,
    email_confirm: true,
    password,
  });
  if (error || !data.user)
    throw new Error(error?.message ?? "Could not create test user.");
  return data.user;
}

async function seedHousehold(
  supabase: SupabaseClient,
  options: { locale: "ar" | "en"; name: string; withMember: boolean },
) {
  const password = `T1a-${randomBytes(18).toString("base64url")}!`;
  const slug = options.locale === "ar" ? "ar" : "en";
  const owner = await createAuthUser(
    supabase,
    `phase1a-owner-${slug}@example.test`,
    password,
    "household_owner",
  );
  const family = await dataOrThrow(
    supabase
      .from("families")
      .insert({ locale: options.locale, name: options.name })
      .select("id")
      .single(),
    `Create ${options.locale} household`,
  );

  await dataOrThrow(
    supabase.from("profiles").insert({
      display_name: options.locale === "ar" ? "مالك تجريبي" : "Synthetic Owner",
      family_id: family.id,
      id: owner.id,
      must_change_password: false,
      role: "owner",
      username: `phase1a_owner_${slug}`,
    }),
    `Create ${options.locale} owner profile`,
  );

  let memberCredential: { identifier: string; password: string } | undefined;

  if (options.withMember) {
    const memberPassword = `T1a-${randomBytes(18).toString("base64url")}!`;
    const member = await createAuthUser(
      supabase,
      "phase1a-member-en@example.test",
      memberPassword,
      "household_member",
    );
    await dataOrThrow(
      supabase.from("profiles").insert({
        display_name: "Synthetic Member",
        family_id: family.id,
        id: member.id,
        must_change_password: false,
        role: "member",
        username: "phase1a_member_en",
      }),
      "Create member profile",
    );
    memberCredential = { identifier: "phase1a_member_en", password: memberPassword };
  }

  const source = await dataOrThrow(
    supabase
      .from("income_sources")
      .insert({
        created_by: owner.id,
        family_id: family.id,
        name: options.locale === "ar" ? "دخل تجريبي" : "Synthetic income",
        owner_member_id: owner.id,
        sort_order: 10,
        updated_by: owner.id,
      })
      .select("id")
      .single(),
    "Create synthetic income source",
  );
  const category = await dataOrThrow(
    supabase
      .from("expense_categories")
      .insert({
        created_by: owner.id,
        family_id: family.id,
        name: options.locale === "ar" ? "أساسيات تجريبية" : "Synthetic essentials",
        sort_order: 10,
        type: "essentials",
        updated_by: owner.id,
      })
      .select("id")
      .single(),
    "Create synthetic expense category",
  );
  const account = await dataOrThrow(
    supabase
      .from("accounts")
      .insert({
        created_by: owner.id,
        currency: "DZD",
        current_balance: 250000,
        family_id: family.id,
        name: options.locale === "ar" ? "حساب تجريبي" : "Synthetic cash",
        sort_order: 10,
        type: "cash",
        updated_by: owner.id,
      })
      .select("id")
      .single(),
    "Create synthetic account",
  );

  const month = new Date().toISOString().slice(0, 7);
  await dataOrThrow(
    supabase.from("income_entries").insert({
      amount: 180000,
      created_by: owner.id,
      currency: "DZD",
      family_id: family.id,
      income_month: `${month}-01`,
      member_id: owner.id,
      note: "Synthetic performance fixture",
      source_id: source.id,
      updated_by: owner.id,
    }),
    "Create synthetic income entry",
  );
  await dataOrThrow(
    supabase.from("expense_entries").insert({
      amount: 42000,
      created_by: owner.id,
      currency: "DZD",
      family_id: family.id,
      main_category: "essentials",
      member_id: owner.id,
      note: "Synthetic performance fixture",
      payment_account_id: account.id,
      subcategory_id: category.id,
      transaction_date: `${month}-15`,
      updated_by: owner.id,
    }),
    "Create synthetic expense entry",
  );
  await dataOrThrow(
    supabase.from("settings").insert([
      {
        created_by: owner.id,
        family_id: family.id,
        key: "allocation.defaults",
        updated_by: owner.id,
        value: {
          essentials: 50,
          personal: 10,
          savings: 20,
          investment: 15,
          reserve: 5,
        },
      },
      {
        created_by: owner.id,
        family_id: family.id,
        key: "dashboard.preferences",
        updated_by: owner.id,
        value: {
          defaultMonth: "current",
          kpiMode: "full",
          showBreakdowns: true,
          showGoals: true,
          showHealth: true,
          showNetWorth: true,
          showPlan: true,
          trendRange: 6,
        },
      },
    ]),
    "Create synthetic settings",
  );

  return {
    memberCredential,
    ownerCredential: { identifier: `phase1a_owner_${slug}`, password },
  };
}

function hostedCredentials(): TestCredentials {
  const credentials: TestCredentials = {};
  if (process.env.E2E_OWNER_IDENTIFIER && process.env.E2E_OWNER_PASSWORD) {
    credentials.owner = {
      identifier: process.env.E2E_OWNER_IDENTIFIER,
      password: process.env.E2E_OWNER_PASSWORD,
    };
  }
  if (process.env.E2E_MEMBER_IDENTIFIER && process.env.E2E_MEMBER_PASSWORD) {
    credentials.member = {
      identifier: process.env.E2E_MEMBER_IDENTIFIER,
      password: process.env.E2E_MEMBER_PASSWORD,
    };
  }
  return credentials;
}

async function captureQueryPlans() {
  try {
    const family = `(select id from public.families where name = 'Phase 1A English Household' limit 1)`;
    const queries = [
      `select income_month, amount, currency from public.income_entries where family_id = ${family} and income_month >= date_trunc('month', current_date) - interval '11 months' and income_month < date_trunc('month', current_date) + interval '1 month'`,
      `select id, current_version_id from public.monthly_plans where family_id = ${family} and month_key = date_trunc('month', current_date)::date limit 1`,
      `select id, transaction_date, month_key, main_category, amount, currency, member_id from public.expense_entries where family_id = ${family} and month_key >= date_trunc('year', current_date) and month_key < date_trunc('year', current_date) + interval '1 year'`,
      `select id, name, type, currency, current_balance from public.accounts where family_id = ${family} and is_active = true`,
      `select id, name, type, is_active, sort_order from public.expense_categories where family_id = ${family} order by type, sort_order, name`,
    ];
    const output = queries
      .map((query) =>
        execFileSync(
          "npx",
          [
            "supabase",
            "db",
            "query",
            "--local",
            `explain (analyze, buffers, format text) ${query}`,
          ],
          {
            cwd: process.cwd(),
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
          },
        ),
      )
      .join("\n---\n");
    const sanitized = output
      .replace(/\u001b\[[0-9;]*m/g, "")
      .replace(
        /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
        "<redacted-uuid>",
      );
    await writeFile(path.join(performanceArtifactRoot, "query-plans.txt"), sanitized);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown query-plan error";
    await writeFile(
      path.join(performanceArtifactRoot, "query-plans-error.txt"),
      `${message}\n`,
    );
  }
}

async function summarizePerformanceArtifacts() {
  const files = await readdir(performanceArtifactRoot).catch(() => []);
  const routeFiles = files.filter(
    (file) => file.endsWith(".json") && file !== "summary.json",
  );
  const routes = [];
  for (const file of routeFiles) {
    routes.push(
      JSON.parse(await readFile(path.join(performanceArtifactRoot, file), "utf8")),
    );
  }
  routes.sort((left, right) => {
    const leftKey = `${left.route}-${left.locale ?? ""}-${left.profile ?? ""}`;
    const rightKey = `${right.route}-${right.locale ?? ""}-${right.profile ?? ""}`;
    return leftKey.localeCompare(rightKey);
  });
  await writeFile(
    path.join(performanceArtifactRoot, "summary.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), routes }, null, 2)}\n`,
  );
}

export default async function globalSetup() {
  // Reports are ephemeral build artifacts. Resetting this directory prevents a
  // renamed route or profile from leaking stale measurements into the summary.
  await rm(performanceArtifactRoot, { force: true, recursive: true });
  await mkdir(authArtifactRoot, { recursive: true });
  await mkdir(performanceArtifactRoot, { recursive: true });

  if (process.env.E2E_LOCAL_SUPABASE !== "1") {
    // Hosted mode never provisions or deletes users. Only explicitly supplied
    // environment credentials are made available to the authentication setup.
    await writeFile(credentialFile, JSON.stringify(hostedCredentials()));
    return async () => summarizePerformanceArtifacts();
  }

  cleanupLocalFixtures();
  const supabase = adminClient();
  const english = await seedHousehold(supabase, {
    locale: "en",
    name: "Phase 1A English Household",
    withMember: true,
  });
  const arabic = await seedHousehold(supabase, {
    locale: "ar",
    name: "Phase 1A Arabic Household",
    withMember: false,
  });
  const credentials: TestCredentials = {
    owner: english.ownerCredential,
    member: english.memberCredential,
    "arabic-owner": arabic.ownerCredential,
  };
  await writeFile(credentialFile, JSON.stringify(credentials));

  return async () => {
    // Capture plans before deleting the synthetic households they reference.
    await captureQueryPlans();
    await summarizePerformanceArtifacts();
    cleanupLocalFixtures();
  };
}
