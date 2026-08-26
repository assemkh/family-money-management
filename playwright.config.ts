import { execFileSync } from "node:child_process";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { defineConfig, devices } from "@playwright/test";

const projectRoot = process.cwd();
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const externalServer = Boolean(process.env.PLAYWRIGHT_BASE_URL);

function parseSupabaseStatus(output: string) {
  const values = new Map<string, string>();
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
    if (match) values.set(match[1], match[2].replace(/"$/, ""));
  }
  return values;
}

function configureDisposableLocalSupabase() {
  if (process.env.E2E_SUPABASE_MODE === "hosted" || externalServer) return false;

  try {
    const output = execFileSync("npx", ["supabase", "status", "--output", "env"], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const values = parseSupabaseStatus(output);
    const url = values.get("API_URL");
    const publishableKey = values.get("PUBLISHABLE_KEY") ?? values.get("ANON_KEY");
    const secretKey = values.get("SECRET_KEY") ?? values.get("SERVICE_ROLE_KEY");
    if (!url || !publishableKey || !secretKey) return false;

    // Process variables take precedence over .env.local, preventing the test
    // server from accidentally touching the hosted household project.
    process.env.NEXT_PUBLIC_SUPABASE_URL = url;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = publishableKey;
    process.env.SUPABASE_SECRET_KEY = secretKey;
    process.env.NEXT_PUBLIC_SITE_URL = baseURL;
    process.env.E2E_LOCAL_SUPABASE = "1";
    return true;
  } catch {
    return false;
  }
}

configureDisposableLocalSupabase();
process.env.FMM_PERFORMANCE_TRACE_TOKEN ??= `phase-1a-${randomUUID()}`;

const sharedBrowser = {
  ...devices["Desktop Chrome"],
  viewport: { width: 1280, height: 900 },
};

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: ".artifacts/playwright/test-results",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [
        ["line"],
        ["html", { outputFolder: ".artifacts/playwright/report", open: "never" }],
      ]
    : [
        ["list"],
        ["html", { outputFolder: ".artifacts/playwright/report", open: "never" }],
      ],
  use: {
    baseURL,
    colorScheme: "light",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: externalServer
    ? undefined
    : {
        command: "npm run start -- --hostname 127.0.0.1 --port 3100",
        env: {
          ...process.env,
          FMM_PERFORMANCE_TRACE_TOKEN: process.env.FMM_PERFORMANCE_TRACE_TOKEN,
          NEXT_PUBLIC_SITE_URL: baseURL,
        },
        reuseExistingServer: false,
        timeout: 120_000,
        url: `${baseURL}/api/health`,
      },
  projects: [
    {
      name: "auth-setup",
      testMatch: /auth\.setup\.ts/,
      use: sharedBrowser,
    },
    {
      name: "public-chromium",
      testMatch: /public-.*\.spec\.ts/,
      use: sharedBrowser,
    },
    {
      name: "owner-chromium",
      dependencies: ["auth-setup"],
      testMatch: [
        /authenticated-accessibility\.spec\.ts/,
        /performance-baseline\.spec\.ts/,
        /responsive-baseline\.spec\.ts/,
      ],
      use: {
        ...sharedBrowser,
        storageState: path.join(projectRoot, ".artifacts", "auth", "owner.json"),
      },
    },
    {
      name: "member-chromium",
      dependencies: ["auth-setup"],
      testMatch: /authenticated-accessibility\.spec\.ts/,
      use: {
        ...sharedBrowser,
        storageState: path.join(projectRoot, ".artifacts", "auth", "member.json"),
      },
    },
    {
      name: "arabic-owner-chromium",
      dependencies: ["auth-setup"],
      testMatch: [
        /authenticated-accessibility\.spec\.ts/,
        /locale-font-baseline\.spec\.ts/,
        /responsive-baseline\.spec\.ts/,
      ],
      use: {
        ...sharedBrowser,
        storageState: path.join(projectRoot, ".artifacts", "auth", "arabic-owner.json"),
      },
    },
  ],
});
