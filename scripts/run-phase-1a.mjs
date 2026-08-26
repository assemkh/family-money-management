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
      "Phase 1.A needs the disposable local Supabase stack. Run `npm run supabase:start` first.",
    );
  }

  const values = parseSupabaseStatus(output);
  const url = values.get("API_URL");
  const publishableKey = values.get("PUBLISHABLE_KEY") ?? values.get("ANON_KEY");
  const secretKey = values.get("SECRET_KEY") ?? values.get("SERVICE_ROLE_KEY");
  if (!url || !publishableKey || !secretKey) {
    throw new Error(
      "The local Supabase status did not include all required test values.",
    );
  }

  return {
    ...process.env,
    E2E_LOCAL_SUPABASE: "1",
    NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    NEXT_PUBLIC_SUPABASE_URL: url,
    SUPABASE_SECRET_KEY: secretKey,
  };
}

async function run(command, args, environment) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: environment,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `${command} ${args.join(" ")} failed${signal ? ` with ${signal}` : ` with code ${code}`}.`,
        ),
      );
    });
  });
}

async function main() {
  const environment = localSupabaseEnvironment();

  // NEXT_PUBLIC values are compiled into the browser bundle, so the disposable
  // local project must be selected before `next build`, not only before `next start`.
  await run("npm", ["run", "build"], environment);
  await run("npm", ["run", "analyze:assets"], environment);
  await run("npx", ["playwright", "test"], environment);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Phase 1.A runner failed.");
  process.exitCode = 1;
});
