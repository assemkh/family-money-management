import {
  localSupabaseEnvironment,
  resetFixture,
  runProcess,
  runSql,
} from "./characterization/local-fixture.mjs";

const environment = localSupabaseEnvironment();
let failure;

// Reseed from scratch every run. A partially-updated fixture would make a snapshot
// mismatch look like a refactor regression.
resetFixture();
runSql("scripts/characterization/seed.sql");

try {
  await runProcess(
    "npx",
    [
      "vitest",
      "run",
      "--config",
      "vitest.characterization.mts",
      ...process.argv.slice(2),
    ],
    environment,
  );
} catch (error) {
  failure = error;
} finally {
  resetFixture();
}

if (failure) {
  console.error(String(failure.message ?? failure));
  process.exitCode = 1;
}
