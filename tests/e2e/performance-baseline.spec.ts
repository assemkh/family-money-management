import { expect, test, type APIRequestContext } from "@playwright/test";

import { projectHasCredentials } from "./support/credentials";
import {
  createLabPage,
  labProfiles,
  measureInteractionToPaint,
  readBrowserMetrics,
  saveLabReport,
} from "./support/lab-performance";

const measuredRoutes = [
  "/dashboard",
  "/expenses",
  "/reports",
  "/net-worth",
  "/monthly-plan",
  "/settings",
] as const;

type TraceResponse = {
  supabase: Array<{
    durationMs: number;
    method: string;
    resource: string;
    status: number;
  }>;
};

async function resetServerTrace(request: APIRequestContext) {
  const response = await request.delete("/api/internal/performance", {
    headers: {
      "x-performance-trace-token": process.env.FMM_PERFORMANCE_TRACE_TOKEN ?? "",
    },
  });
  expect(response.status()).toBe(204);
}

async function readServerTrace(request: APIRequestContext) {
  const response = await request.get("/api/internal/performance", {
    headers: {
      "x-performance-trace-token": process.env.FMM_PERFORMANCE_TRACE_TOKEN ?? "",
    },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as TraceResponse;
}

test.beforeEach(async ({}, testInfo) => {
  test.skip(
    !(await projectHasCredentials(testInfo.project.name)),
    "Performance authentication fixture is not configured.",
  );
  test.skip(
    process.env.E2E_LOCAL_SUPABASE !== "1" &&
      process.env.E2E_ALLOW_HOSTED_PERFORMANCE !== "1",
    "Hosted performance traffic is disabled unless explicitly authorized.",
  );
});

for (const route of measuredRoutes) {
  for (const profile of labProfiles) {
    test(`${route} captures a privacy-safe ${profile.name} baseline`, async ({
      context,
      request,
    }, testInfo) => {
      await resetServerTrace(request);
      const page = await createLabPage(context, profile);

      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("main")).toBeVisible();
      await page.waitForTimeout(1_000);

      const desktopThemeTrigger = page
        .locator('header button[aria-haspopup="menu"]')
        .first();
      const mobileMenuTrigger = page.locator("header details summary").first();
      const interactionTrigger = (await desktopThemeTrigger.isVisible())
        ? desktopThemeTrigger
        : mobileMenuTrigger;
      const interactionToPaintMs = await measureInteractionToPaint(
        page,
        interactionTrigger,
      );
      const browser = await readBrowserMetrics(page);
      const locale = await page
        .locator("main")
        .locator("xpath=ancestor::*[@lang][1]")
        .getAttribute("lang");
      const server = await readServerTrace(request);
      const supabaseDurationMs = Number(
        server.supabase.reduce((total, item) => total + item.durationMs, 0).toFixed(2),
      );
      const report = {
        browser: { ...browser, interactionToPaintMs },
        generatedAt: new Date().toISOString(),
        locale: locale ?? "unknown",
        profile: profile.name,
        route,
        supabase: {
          durationMs: supabaseDurationMs,
          requestCount: server.supabase.length,
          resources: server.supabase,
        },
        viewport: page.viewportSize(),
      };

      const routeName = route.slice(1).replaceAll("/", "-");
      await saveLabReport(
        `${routeName}-${profile.name}.json`,
        `${routeName}-${profile.name}-performance`,
        report,
        testInfo,
      );
      await page.close();
    });
  }
}
