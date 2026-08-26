import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { expectNoSeriousAccessibilityViolations } from "./support/accessibility";
import { expectNoPageOverflow, setTheme } from "./support/layout";
import { screenshotArtifactRoot } from "./support/paths";

const viewportMatrix = [320, 375, 430, 768, 1024, 1280, 1440] as const;

test("login is keyboard-readable and has no serious accessibility violations", async ({
  page,
}, testInfo) => {
  await page.goto("/login");
  await expect(page.locator('input[name="identifier"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page, testInfo, "login");
});

for (const width of viewportMatrix) {
  for (const theme of ["light", "dark"] as const) {
    for (const direction of ["ltr", "rtl"] as const) {
      test(`public login baseline at ${width}px, ${theme}, ${direction}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: width < 768 ? 780 : 900 });
        await page.goto("/login");
        await setTheme(page, theme);
        await page.evaluate((dir) => {
          // The public route has no locale selector yet. Switching document
          // direction still catches structural RTL regressions without fake copy.
          document.documentElement.dir = dir;
        }, direction);
        await expectNoPageOverflow(page);

        const directory = path.join(screenshotArtifactRoot, "public");
        await mkdir(directory, { recursive: true });
        await page.screenshot({
          animations: "disabled",
          fullPage: true,
          path: path.join(directory, `login-${width}-${theme}-${direction}.png`),
        });
      });
    }
  }
}
