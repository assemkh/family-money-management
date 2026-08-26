import { expect, test } from "@playwright/test";

import { expectNoSeriousAccessibilityViolations } from "./support/accessibility";
import { projectHasCredentials, roleForProject } from "./support/credentials";
import { expectNoPageOverflow } from "./support/layout";

const commonRoutes = ["/dashboard", "/expenses", "/income", "/reports"] as const;
const accessibilityBaseline: Record<string, Record<string, number>> = {
  "/dashboard": { "scrollable-region-focusable": 1 },
  "/expenses": { "color-contrast": 4 },
  "/income": { "color-contrast": 2 },
  "/reports": { "scrollable-region-focusable": 2 },
};

test.beforeEach(async ({}, testInfo) => {
  test.skip(
    !(await projectHasCredentials(testInfo.project.name)),
    "This role has no local fixture or explicit hosted E2E credentials.",
  );
});

for (const route of [...commonRoutes, "/settings"] as const) {
  test(`${route} has no serious accessibility or page-overflow regression`, async ({
    page,
  }, testInfo) => {
    const role = roleForProject(testInfo.project.name);
    test.skip(
      route === "/settings" && role === "member",
      "Settings owner controls are audited by owner projects.",
    );

    const response = await page.goto(route);
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(new RegExp(`${route.replace("/", "\\/")}(?:\\?.*)?$`));
    await expect(page.locator("main")).toBeVisible();
    await expectNoPageOverflow(page);
    await expectNoSeriousAccessibilityViolations(
      page,
      testInfo,
      `${role ?? "unknown"}-${route.slice(1)}`,
      accessibilityBaseline[route],
    );
  });
}

test("settings confirmation dialog remains accessible when modal", async ({
  page,
}, testInfo) => {
  const role = roleForProject(testInfo.project.name);
  test.skip(
    role === "member",
    "Only household owners can open settings management dialogs.",
  );

  await page.goto("/settings");
  // The shell's navigation sheet is a dialog too, so scope to the settings
  // confirmation dialogs, which are the ones nested inside a disclosure.
  const candidate = page.locator("details dialog").first();
  const details = candidate.locator("xpath=ancestor::details[1]");
  await details.evaluate((element: HTMLDetailsElement) => {
    element.open = true;
  });
  const opener = details
    .getByRole("button", { name: /Archive|Pause access|أرشفة|إيقاف الوصول/i })
    .first();
  await expect(opener).toBeVisible();
  // Use the real opener so the component's click behavior and native focus
  // movement are included in the dialog accessibility baseline.
  await opener.click();
  const dialog = page.locator("dialog[open]").filter({ visible: true }).first();
  await expect(dialog).toBeVisible();
  await expectNoSeriousAccessibilityViolations(
    page,
    testInfo,
    `${role}-settings-dialog`,
    { "color-contrast": 1 },
  );
});
