import { execFileSync, spawn } from "node:child_process";

function parseSupabaseStatus(output) {
  const values = new Map();
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
    if (match) values.set(match[1], match[2].replace(/"$/, ""));
  }
  return values;
}

function localSupabaseEnvironment() {
  let output;
  try {
    output = execFileSync("npx", ["supabase", "status", "--output", "env"], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    throw new Error(
      "Characterization needs the disposable local Supabase stack. Run `npm run supabase:start` first.",
    );
  }

  const values = parseSupabaseStatus(output);
  const url = values.get("API_URL");
  const secretKey = values.get("SECRET_KEY") ?? values.get("SERVICE_ROLE_KEY");
  if (!url || !secretKey) {
    throw new Error("The local Supabase status did not include all required values.");
  }

  return {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      values.get("PUBLISHABLE_KEY") ?? values.get("ANON_KEY") ?? "",
    SUPABASE_SECRET_KEY: secretKey,
  };
}

function runSql(file) {
  try {
    execFileSync("npx", ["supabase", "db", "query", "--local", "--file", file], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const detail = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim();
    throw new Error(`${file} failed: ${detail || error.message}`);
  }
}

/**
 * Monthly Plan Revisions are append-only, and that trigger fires on the cascade too,
 * so fixture teardown cannot remove them while it is active. The guard is disabled
 * only around the delete and restored unconditionally, including on failure.
 */
function resetFixture() {
  runSql("scripts/characterization/disable-revision-guard.sql");
  try {
    runSql("scripts/characterization/cleanup.sql");
  } finally {
    runSql("scripts/characterization/enable-revision-guard.sql");
  }
}

async function run(command, args, environment) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: environment,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)),
    );
  });
}

const environment = localSupabaseEnvironment();
let failure;

// Reseed from scratch every run. A partially-updated fixture would make a snapshot
// mismatch look like a refactor regression.
resetFixture();
runSql("scripts/characterization/seed.sql");

try {
  await run(
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
