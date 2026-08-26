import { mkdir, writeFile } from "node:fs/promises";

import { test as setup, expect } from "@playwright/test";

import { readTestCredentials } from "./support/credentials";
import { authArtifactRoot, storageStateFiles } from "./support/paths";

setup("create isolated owner and member browser sessions", async ({ browser }) => {
  await mkdir(authArtifactRoot, { recursive: true });
  const credentials = await readTestCredentials();

  for (const [role, statePath] of Object.entries(storageStateFiles)) {
    const credential = credentials[role as keyof typeof credentials];
    if (!credential) {
      // An empty state lets the dependent project load and mark itself skipped
      // when hosted E2E credentials were intentionally not configured.
      await writeFile(statePath, JSON.stringify({ cookies: [], origins: [] }));
      continue;
    }

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/login");
    await page.locator('input[name="identifier"]').fill(credential.identifier);
    await page.locator('input[name="password"]').fill(credential.password);
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/, { timeout: 20_000 });
    await context.storageState({ path: statePath });
    await context.close();
  }
});
