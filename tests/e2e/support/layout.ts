import { expect, type Page } from "@playwright/test";

export async function expectNoPageOverflow(page: Page, currentBaselineMax?: number) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  // A one-pixel tolerance avoids failures caused only by fractional transforms.
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(
    Math.max(dimensions.clientWidth + 1, currentBaselineMax ?? 0),
  );
}

export async function setTheme(page: Page, theme: "dark" | "light") {
  await page.evaluate((selectedTheme) => {
    localStorage.setItem("theme", selectedTheme);
    document.documentElement.classList.toggle("dark", selectedTheme === "dark");
  }, theme);
  await page.reload({ waitUntil: "domcontentloaded" });
}
