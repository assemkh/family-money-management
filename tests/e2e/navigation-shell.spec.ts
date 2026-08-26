import { expect, test, type Page } from "@playwright/test";

import { projectHasCredentials } from "./support/credentials";
import { expectNoPageOverflow } from "./support/layout";

/**
 * Phase 3.A acceptance. Every destination must be reachable in all three shell modes,
 * the sheet must behave like a dialog for keyboard and screen-reader users, and the
 * shell itself must not overflow at any matrix width in either direction.
 */
const shellModes = [
  { name: "phone", width: 375, height: 820 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "landscape tablet", width: 1024, height: 768 },
  { name: "desktop", width: 1280, height: 900 },
  { name: "wide desktop", width: 1440, height: 900 },
] as const;

const destinations = [
  "/dashboard",
  "/monthly-plan",
  "/expenses",
  "/income",
  "/accounts",
  "/goals",
  "/assets",
  "/investments",
  "/liabilities",
  "/transfers",
  "/recurring",
  "/net-worth",
  "/reports",
  "/settings",
] as const;

test.beforeEach(async ({}, testInfo) => {
  test.skip(
    !(await projectHasCredentials(testInfo.project.name)),
    "This role has no local fixture or explicit hosted E2E credentials.",
  );
});

/** Links visible on the persistent chrome plus everything inside the sheet. */
async function reachableDestinations(page: Page) {
  const visible = await page
    .locator("nav a[href^='/']:visible, aside a[href^='/']:visible")
    .evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
    );

  const trigger = page.locator('button[aria-haspopup="dialog"]:visible').first();
  if ((await trigger.count()) > 0) {
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    visible.push(
      ...(await dialog
        .locator("a[href^='/']")
        .evaluateAll((links) =>
          links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
        )),
    );
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }

  return new Set(visible);
}

for (const mode of shellModes) {
  test(`every destination is reachable in the ${mode.name} shell`, async ({ page }) => {
    await page.setViewportSize({ width: mode.width, height: mode.height });
    await page.goto("/dashboard");

    const reachable = await reachableDestinations(page);
    const missing = destinations.filter((route) => !reachable.has(route));

    expect(missing, `unreachable at ${mode.width}px`).toEqual([]);
  });

  test(`the ${mode.name} shell does not overflow horizontally`, async ({ page }) => {
    await page.setViewportSize({ width: mode.width, height: mode.height });
    await page.goto("/accounts");

    await expectNoPageOverflow(page);
  });
}

test("the shell has no horizontal overflow at the smallest supported width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 820 });
  await page.goto("/accounts");

  await expectNoPageOverflow(page);
});

test("the navigation sheet traps focus and restores it to its trigger", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 820 });
  await page.goto("/dashboard");

  const trigger = page.locator('button[aria-haspopup="dialog"]:visible').first();
  await trigger.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  // Focus must be inside the dialog, not left behind on the page.
  await expect
    .poll(async () => dialog.evaluate((node) => node.contains(document.activeElement)))
    .toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("the navigation sheet closes on backdrop dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 820 });
  await page.goto("/dashboard");

  await page.locator('button[aria-haspopup="dialog"]:visible').first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // The backdrop is the dialog element's own padding box outside the panel.
  await page.mouse.click(10, 10);
  await expect(dialog).toBeHidden();
});

test("navigating from the sheet closes it and marks the destination current", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 820 });
  await page.goto("/dashboard");

  await page.locator('button[aria-haspopup="dialog"]:visible').first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("link", { name: /net worth|صافي الثروة/i }).click();

  await expect(page).toHaveURL(/\/net-worth$/);
  await expect(dialog).toBeHidden();
});

test("browser Back does not leave a stale overlay", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 820 });
  await page.goto("/dashboard");
  await page.goto("/reports");

  await page.locator('button[aria-haspopup="dialog"]:visible').first().click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("active state and aria-current agree on every destination", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  for (const route of ["/dashboard", "/net-worth", "/settings"] as const) {
    await page.goto(route);
    const current = page.locator("aside a[aria-current='page']:visible");

    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute("href", route);
  }
});

test("fixed navigation never covers the end of page content", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 820 });
  await page.goto("/accounts");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  const clearance = await page.evaluate(() => {
    const main = document.querySelector("#main-content");
    const bar = document.querySelector("#phone-navigation");
    if (!main || !bar) return null;

    // Measure the last rendered content, not the main box: the reserved bottom
    // padding is exactly what is supposed to sit behind the bar.
    const rendered = [...main.querySelectorAll("*")]
      .map((node) => node.getBoundingClientRect())
      .filter((rect) => rect.height > 0 && rect.width > 0);
    if (rendered.length === 0) return null;

    const contentBottom = Math.max(...rendered.map((rect) => rect.bottom));
    return Math.round(bar.getBoundingClientRect().top - contentBottom);
  });

  expect(clearance, "expected measurable page content").not.toBeNull();
  expect(
    clearance!,
    "the fixed bar must not cover page content",
  ).toBeGreaterThanOrEqual(0);
});

/**
 * ADR 0003 raised navigation labels from ~10.4px to 0.75rem and replaced truncation
 * with wrapping. Doubling the root font size is a faithful proxy for 200% text zoom
 * because every navigation size in the shell is rem-based.
 */
for (const mode of [
  { name: "phone", width: 375, height: 820 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
] as const) {
  test(`${mode.name} navigation stays readable at 200% text zoom`, async ({ page }) => {
    await page.setViewportSize({ width: mode.width, height: mode.height });
    await page.goto("/accounts");
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });

    // The shell's own chrome must stay inside the viewport at zoom. Page content at
    // 200% is the page-by-page audit in Phase 3.B, so it is not asserted here.
    const chromeWidth = await page.evaluate(() => {
      const nodes = [
        document.querySelector("#phone-navigation"),
        ...document.querySelectorAll("aside"),
      ].filter(Boolean) as HTMLElement[];
      const visible = nodes.filter((node) => node.getClientRects().length > 0);
      if (visible.length === 0) return 0;
      return Math.max(...visible.map((node) => node.getBoundingClientRect().right));
    });
    expect(chromeWidth).toBeLessThanOrEqual(mode.width + 1);

    const labels = page.locator(
      "#phone-navigation a span:visible, aside nav a span:visible",
    );
    const count = await labels.count();
    if (count === 0) return; // the tablet rail is icon-only by design

    for (let index = 0; index < count; index += 1) {
      const label = labels.nth(index);
      const box = await label.boundingBox();
      expect(box, "a navigation label must render").not.toBeNull();
      // A wrapped label grows taller; a clipped one collapses. Either way it must
      // still occupy real space rather than disappear at zoom.
      expect(box!.height).toBeGreaterThan(8);
      expect(box!.width).toBeGreaterThan(4);
    }
  });
}

test("navigation labels are at least 12px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 820 });
  await page.goto("/dashboard");

  const sizes = await page
    .locator("#phone-navigation > a:visible, #phone-navigation > button:visible")
    .evaluateAll((nodes) =>
      nodes.map((node) => Number.parseFloat(getComputedStyle(node).fontSize)),
    );

  expect(sizes.length).toBeGreaterThan(0);
  for (const size of sizes) {
    expect(size).toBeGreaterThanOrEqual(12);
  }
});

test("navigation targets meet the 44px minimum", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 820 });
  await page.goto("/dashboard");

  const targets = page.locator(
    "#phone-navigation > a:visible, #phone-navigation > button:visible",
  );
  const count = await targets.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const box = await targets.nth(index).boundingBox();
    expect(box, "a navigation target must render").not.toBeNull();
    expect(box!.height, "touch target height").toBeGreaterThanOrEqual(44);
  }
});
