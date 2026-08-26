import { expect, test } from "@playwright/test";

import {
  createLabPage,
  labProfiles,
  measureInteractionToPaint,
  readBrowserMetrics,
  saveLabReport,
} from "./support/lab-performance";

for (const profile of labProfiles) {
  test(`login captures a privacy-safe ${profile.name} baseline`, async ({
    context,
  }, testInfo) => {
    const page = await createLabPage(context, profile);
    const response = await page.goto("/login", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(500);

    const identifier = page.locator('input[name="identifier"]');
    await expect(identifier).toBeVisible();
    await page.waitForTimeout(1_000);

    // Focusing an empty field is representative and cannot write credentials or
    // user data into this public route's diagnostic artifact.
    const interactionToPaintMs = await measureInteractionToPaint(page, identifier);
    const browser = await readBrowserMetrics(page);
    const report = {
      browser: { ...browser, interactionToPaintMs },
      generatedAt: new Date().toISOString(),
      locale: "en",
      profile: profile.name,
      route: "/login",
      supabase: { durationMs: 0, requestCount: 0, resources: [] },
      viewport: page.viewportSize(),
    };

    await saveLabReport(
      `login-${profile.name}.json`,
      `login-${profile.name}-performance`,
      report,
      testInfo,
    );
    await page.close();
  });
}
