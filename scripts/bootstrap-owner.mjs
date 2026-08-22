import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const bootstrapEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z
    .string()
    .min(32)
    .refine((value) => value.startsWith("sb_secret_") || value.startsWith("eyJ")),
  BOOTSTRAP_ADMIN_EMAIL: z.email(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(8).max(128),
  BOOTSTRAP_ADMIN_USERNAME: z
    .string()
    .regex(/^[a-z0-9][a-z0-9._-]{2,31}$/)
    .default("assemkh"),
  BOOTSTRAP_ADMIN_DISPLAY_NAME: z.string().trim().min(1).max(100).default("Assem"),
  BOOTSTRAP_FAMILY_NAME: z.string().trim().min(1).max(100).default("Assem Family"),
});

function readEnvironment() {
  const result = bootstrapEnvironmentSchema.safeParse(process.env);

  if (!result.success) {
    const missing = [
      ...new Set(result.error.issues.map((issue) => issue.path.join("."))),
    ].join(", ");
    throw new Error(`Owner bootstrap configuration is invalid: ${missing}`);
  }

  return result.data;
}

function createAdminClient(environment) {
  return createClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}

async function findUserByEmail(supabase, email) {
  const normalizedEmail = email.toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) throw error;

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === normalizedEmail,
    );

    if (user) return user;
    if (data.users.length < 100) return null;
  }

  throw new Error("Owner lookup exceeded the safe pagination limit.");
}

async function removePartialBootstrap(supabase, { createdFamilyId, createdUserId }) {
  if (createdFamilyId) {
    await supabase.from("families").delete().eq("id", createdFamilyId);
  }

  if (createdUserId) {
    await supabase.auth.admin.deleteUser(createdUserId);
  }
}

async function seedFamilyFoundation(supabase, familyId, ownerId) {
  const { data: existingSources, error: sourceLookupError } = await supabase
    .from("income_sources")
    .select("name")
    .eq("family_id", familyId);

  if (sourceLookupError) throw sourceLookupError;

  const existingSourceNames = new Set(existingSources.map((source) => source.name));
  const sourceSeeds = [
    { name: "Assem Source 1", owner_member_id: ownerId, sort_order: 10 },
    { name: "Assem Source 2", owner_member_id: ownerId, sort_order: 20 },
    { name: "Wife Source 1", owner_member_id: null, sort_order: 30 },
    { name: "Wife Source 2", owner_member_id: null, sort_order: 40 },
  ].filter((source) => !existingSourceNames.has(source.name));

  if (sourceSeeds.length > 0) {
    const { error } = await supabase.from("income_sources").insert(
      sourceSeeds.map((source) => ({
        ...source,
        family_id: familyId,
        created_by: ownerId,
        updated_by: ownerId,
      })),
    );
    if (error) throw error;
  }

  const { data: familyCategories, error: categoryLookupError } = await supabase
    .from("expense_categories")
    .select("name, type")
    .eq("family_id", familyId);

  if (categoryLookupError) throw categoryLookupError;

  if (familyCategories.length === 0) {
    const { data: templates, error: templateError } = await supabase
      .from("expense_categories")
      .select("name, type, sort_order")
      .is("family_id", null);

    if (templateError) throw templateError;

    const { error } = await supabase.from("expense_categories").insert(
      templates.map((category) => ({
        ...category,
        family_id: familyId,
        created_by: ownerId,
        updated_by: ownerId,
      })),
    );
    if (error) throw error;
  }

  const { error: accountError } = await supabase.from("accounts").upsert(
    [
      { name: "Cash", type: "cash", currency: "DZD", sort_order: 10 },
      { name: "CCP", type: "postal", currency: "DZD", sort_order: 20 },
      { name: "EUR", type: "foreign_currency", currency: "EUR", sort_order: 30 },
      { name: "USD", type: "foreign_currency", currency: "USD", sort_order: 40 },
    ].map((account) => ({
      ...account,
      family_id: familyId,
      created_by: ownerId,
      updated_by: ownerId,
    })),
    { onConflict: "family_id,name", ignoreDuplicates: true },
  );

  if (accountError) throw accountError;

  const { error: settingsError } = await supabase.from("settings").upsert(
    [
      {
        key: "allocation.defaults",
        value: {
          essentials: 50,
          personal: 10,
          savings: 20,
          investment: 15,
          reserve: 5,
        },
      },
      { key: "currencies.supported", value: ["DZD", "EUR", "USD"] },
      { key: "dashboard.preferences", value: { defaultMonth: "current" } },
    ].map((setting) => ({
      ...setting,
      family_id: familyId,
      created_by: ownerId,
      updated_by: ownerId,
    })),
    { onConflict: "family_id,key", ignoreDuplicates: true },
  );

  if (settingsError) throw settingsError;
}

async function bootstrapOwner() {
  const environment = readEnvironment();
  const supabase = createAdminClient(environment);
  let user = await findUserByEmail(supabase, environment.BOOTSTRAP_ADMIN_EMAIL);
  let createdUserId = null;
  let createdFamilyId = null;

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: environment.BOOTSTRAP_ADMIN_EMAIL,
      password: environment.BOOTSTRAP_ADMIN_PASSWORD,
      email_confirm: true,
      app_metadata: { account_type: "household_owner" },
    });

    if (error) throw error;

    user = data.user;
    createdUserId = user.id;
  }

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("profiles")
    .select("id, family_id, username, role, must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  if (profileLookupError) {
    await removePartialBootstrap(supabase, { createdUserId });
    throw profileLookupError;
  }

  if (existingProfile) {
    if (
      existingProfile.username !== environment.BOOTSTRAP_ADMIN_USERNAME ||
      existingProfile.role !== "owner"
    ) {
      throw new Error(
        "The configured Auth user already has a conflicting application profile.",
      );
    }

    await seedFamilyFoundation(supabase, existingProfile.family_id, user.id);
    console.info("Owner bootstrap and family seed data are already complete.");
    return;
  }

  const { data: family, error: familyError } = await supabase
    .from("families")
    .insert({ name: environment.BOOTSTRAP_FAMILY_NAME })
    .select("id")
    .single();

  if (familyError) {
    await removePartialBootstrap(supabase, { createdUserId });
    throw familyError;
  }

  createdFamilyId = family.id;

  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    family_id: family.id,
    display_name: environment.BOOTSTRAP_ADMIN_DISPLAY_NAME,
    username: environment.BOOTSTRAP_ADMIN_USERNAME,
    role: "owner",
    must_change_password: true,
  });

  if (profileError) {
    await removePartialBootstrap(supabase, { createdFamilyId, createdUserId });
    throw profileError;
  }

  try {
    await seedFamilyFoundation(supabase, family.id, user.id);
  } catch (error) {
    await removePartialBootstrap(supabase, { createdFamilyId, createdUserId });
    throw error;
  }

  console.info(
    "Owner bootstrap completed. The first login must change the temporary password.",
  );
}

bootstrapOwner().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown bootstrap error";
  console.error(`Owner bootstrap failed: ${message}`);
  process.exitCode = 1;
});
