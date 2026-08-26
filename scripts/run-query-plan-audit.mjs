import { mkdir, writeFile } from "node:fs/promises";

import {
  localSupabaseEnvironment,
  resetFixture,
  runSql,
} from "./characterization/local-fixture.mjs";

localSupabaseEnvironment();
let failure;

// Always start and end clean so a plan audit cannot change later test results.
resetFixture();
runSql("scripts/characterization/seed.sql");

try {
  runSql("scripts/characterization/scale.sql");
  // Supabase's prepared-query runner accepts one statement per file, so keeping the
  // probes separate also makes a failure identify the exact query shape that moved.
  const plans = [
    runSql("scripts/characterization/query-plan-expenses.sql"),
    runSql("scripts/characterization/query-plan-current-revision.sql"),
    runSql("scripts/characterization/query-plan-unbounded-revisions.sql"),
  ].join("\n");

  // The fixed local fixture makes these planner choices a stable regression gate.
  // If PostgreSQL legitimately finds a better plan, review and update the evidence.
  const expectedPlanEvidence = [
    "expense_entries_family_month_idx",
    "Nested Loop Left Join",
    "monthly_plan_versions_pkey",
    "Seq Scan on monthly_plan_versions",
    "rows=242",
  ];
  for (const evidence of expectedPlanEvidence) {
    if (!plans.includes(evidence)) {
      throw new Error(`Expected query-plan evidence was missing: ${evidence}`);
    }
  }

  await mkdir(".artifacts/performance", { recursive: true });
  await writeFile(".artifacts/performance/phase-2b-query-plans.txt", plans);
  process.stdout.write(plans);
} catch (error) {
  failure = error;
} finally {
  resetFixture();
}

if (failure) {
  console.error(String(failure.message ?? failure));
  process.exitCode = 1;
}
