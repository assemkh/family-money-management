import { expect, test } from "@playwright/test";

import { projectHasCredentials } from "./support/credentials";
import {
  createLabPage,
  labProfiles,
  readBrowserMetrics,
  saveLabReport,
} from "./support/lab-performance";

test.beforeEach(async ({}, testInfo) => {
  test.skip(
    !(await projectHasCredentials(testInfo.project.name)),
    "Arabic performance fixture is not configured.",
  );
  test.skip(
    process.env.E2E_LOCAL_SUPABASE !== "1" &&
      process.env.E2E_ALLOW_HOSTED_PERFORMANCE !== "1",
    "Hosted performance traffic is disabled unless explicitly authorized.",
  );
});

for (const profile of labProfiles) {
  test(`Arabic dashboard captures a ${profile.name} font baseline`, async ({
    context,
  }, testInfo) => {
    const page = await createLabPage(context, profile);
    const response = await page.goto("/dashboard", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("main")).toBeVisible();
    await expect(
      page.locator("main").locator("xpath=ancestor::*[@lang][1]"),
    ).toHaveAttribute("lang", "ar");
    await page.waitForTimeout(1_000);

    // This focused sample answers whether Arabic typography changes the font
    // payload; the owner performance suite owns route and Supabase timings.
    const browser = await readBrowserMetrics(page);
    const report = {
      browser: { ...browser, interactionToPaintMs: null },
      generatedAt: new Date().toISOString(),
      locale: "ar",
      profile: profile.name,
      route: "/dashboard",
      supabase: { durationMs: 0, requestCount: 0, resources: [] },
      viewport: page.viewportSize(),
    };

    await saveLabReport(
      `dashboard-ar-${profile.name}.json`,
      `dashboard-ar-${profile.name}-font-performance`,
      report,
      testInfo,
    );
    await page.close();
  });
}
