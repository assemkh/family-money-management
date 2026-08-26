import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { projectHasCredentials, roleForProject } from "./support/credentials";
import { expectNoPageOverflow, setTheme } from "./support/layout";
import { screenshotArtifactRoot } from "./support/paths";

const viewportMatrix = [320, 375, 430, 768, 1024, 1280, 1440] as const;
const representativeViewports = [375, 768, 1280] as const;
const representativeRoutes = ["/expenses", "/reports", "/settings"] as const;

test.beforeEach(async ({}, testInfo) => {
  test.skip(
    !(await projectHasCredentials(testInfo.project.name)),
    "Responsive authentication fixture is not configured.",
  );
  test.skip(
    process.env.E2E_LOCAL_SUPABASE !== "1" &&
      process.env.E2E_ALLOW_PRIVATE_SCREENSHOTS !== "1",
    "Hosted financial screenshots are disabled unless explicitly authorized.",
  );
});

for (const width of viewportMatrix) {
  for (const theme of ["light", "dark"] as const) {
    test(`dashboard responsive baseline at ${width}px in ${theme}`, async ({
      page,
    }, testInfo) => {
      const role = roleForProject(testInfo.project.name);
      const locale = role === "arabic-owner" ? "ar" : "en";
      await page.setViewportSize({ width, height: width < 768 ? 820 : 960 });
      await page.goto("/dashboard");
      await setTheme(page, theme);
      await expect(
        page.locator("main").locator("xpath=ancestor::*[@dir][1]"),
      ).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      await expectNoPageOverflow(page);

      const directory = path.join(screenshotArtifactRoot, "authenticated", locale);
      await mkdir(directory, { recursive: true });
      await page.screenshot({
        animations: "disabled",
        fullPage: true,
        path: path.join(directory, `dashboard-${width}-${theme}.png`),
      });
    });
  }
}

for (const width of representativeViewports) {
  for (const route of representativeRoutes) {
    test(`${route} representative responsive baseline at ${width}px`, async ({
      page,
    }, testInfo) => {
      const role = roleForProject(testInfo.project.name);
      const locale = role === "arabic-owner" ? "ar" : "en";
      await page.setViewportSize({ width, height: width < 768 ? 820 : 960 });
      await page.goto(route);
      // Phase 3.A cleared the Dashboard allowance by letting the trend card shrink.
      // Reports and Settings still overflow from their own page content, which is the
      // page-by-page audit in Phase 3.B; these ceilings must fall there, never rise.
      const currentBaselineMax =
        width === 375 && route === "/reports"
          ? 602
          : width === 375 && route === "/settings"
            ? 565
            : undefined;
      await expectNoPageOverflow(page, currentBaselineMax);

      const directory = path.join(screenshotArtifactRoot, "authenticated", locale);
      await mkdir(directory, { recursive: true });
      await page.screenshot({
        animations: "disabled",
        fullPage: true,
        path: path.join(directory, `${route.slice(1)}-${width}-light.png`),
      });
    });
  }
}
