import { expect, test } from "@playwright/test";

/**
 * Phase 2.A moved identity resolution behind one Module. These run without any
 * fixture or secret, so CI keeps the fail-closed contract covered: an anonymous
 * caller reaches the login screen and never a household surface.
 */
const protectedRoutes = [
  "/dashboard",
  "/expenses",
  "/income",
  "/settings",
  "/net-worth",
  "/monthly-plan",
  "/reports",
  "/change-password",
] as const;

for (const route of protectedRoutes) {
  test(`anonymous ${route} lands on the login screen`, async ({ page }) => {
    await page.goto(route);

    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
    await expect(page.locator('input[name="identifier"]')).toBeVisible();
  });
}

test("anonymous report export never returns household data", async ({ request }) => {
  const response = await request.get("/reports/export?period=month", {
    maxRedirects: 0,
  });

  // Either the request proxy redirects first or the handler answers 401. Both are
  // fail-closed; what must never happen is a 200 carrying CSV.
  expect([301, 302, 303, 307, 308, 401]).toContain(response.status());
  expect(response.headers()["content-type"] ?? "").not.toContain("text/csv");
});

test("the root route sends an anonymous visitor to login", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
});
