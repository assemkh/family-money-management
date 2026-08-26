import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { BrowserContext, Locator, Page, TestInfo } from "@playwright/test";

import { performanceArtifactRoot } from "./paths";

export const labProfiles = [
  {
    cpuSlowdown: 1,
    name: "desktop",
    network: null,
    viewport: { height: 900, width: 1280 },
  },
  {
    cpuSlowdown: 4,
    name: "mobile",
    network: {
      // A deterministic Fast 4G approximation keeps regressions comparable
      // without pretending that one local run represents field performance.
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      latency: 150,
      uploadThroughput: (750 * 1024) / 8,
    },
    viewport: { height: 812, width: 375 },
  },
] as const;

export type LabProfile = (typeof labProfiles)[number];

declare global {
  interface Window {
    __FAMILY_MONEY_LAB_METRICS__?: { cls: number; inp: number; lcp: number };
  }
}

export async function createLabPage(context: BrowserContext, profile: LabProfile) {
  const page = await context.newPage();
  await page.setViewportSize(profile.viewport);

  const cdp = await context.newCDPSession(page);
  if (profile.network) {
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      connectionType: "cellular4g",
      offline: false,
      ...profile.network,
    });
  }
  await cdp.send("Emulation.setCPUThrottlingRate", {
    rate: profile.cpuSlowdown,
  });

  // Next.js link prefetching is excluded so the trace represents the selected
  // route rather than speculative reads for every visible navigation link.
  await page.route("**/*", async (pendingRoute) => {
    const headers = pendingRoute.request().headers();
    if (headers["next-router-prefetch"] || headers.purpose === "prefetch") {
      await pendingRoute.abort();
      return;
    }
    await pendingRoute.continue();
  });

  await page.addInitScript(() => {
    const values = { cls: 0, inp: 0, lcp: 0 };
    Object.defineProperty(window, "__FAMILY_MONEY_LAB_METRICS__", {
      configurable: true,
      value: values,
      writable: true,
    });

    const observe = (type: string, callback: (entries: PerformanceEntry[]) => void) => {
      try {
        const observer = new PerformanceObserver((list) => callback(list.getEntries()));
        observer.observe({ buffered: true, type });
      } catch {
        // Older browsers can omit individual entry types; navigation and
        // resource timings still produce a useful partial baseline.
      }
    };

    observe("largest-contentful-paint", (entries) => {
      values.lcp = entries.at(-1)?.startTime ?? values.lcp;
    });
    observe("layout-shift", (entries) => {
      for (const entry of entries) {
        const shift = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };
        if (!shift.hadRecentInput) values.cls += shift.value ?? 0;
      }
    });
    observe("event", (entries) => {
      for (const entry of entries) {
        values.inp = Math.max(values.inp, entry.duration);
      }
    });
  });

  return page;
}

export async function measureInteractionToPaint(page: Page, trigger: Locator) {
  if (!(await trigger.isVisible())) return null;

  const interactionStart = await page.evaluate(() => performance.now());
  await trigger.click();
  const interactionEnd = await page.evaluate(
    () =>
      new Promise<number>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve(performance.now())),
        ),
      ),
  );
  return Number((interactionEnd - interactionStart).toFixed(2));
}

export async function readBrowserMetrics(page: Page) {
  return page.evaluate(() => {
    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];
    const lab = window.__FAMILY_MONEY_LAB_METRICS__ ?? {
      cls: 0,
      inp: 0,
      lcp: 0,
    };
    return {
      cls: Number(lab.cls.toFixed(4)),
      decodedBodyBytes: resources.reduce(
        (total, resource) => total + resource.decodedBodySize,
        0,
      ),
      domContentLoadedMs: Number(navigation.domContentLoadedEventEnd.toFixed(2)),
      fcpMs:
        performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null,
      fontTransferBytes: resources
        .filter(
          (resource) =>
            resource.initiatorType === "css" || resource.name.includes(".woff"),
        )
        .reduce((total, resource) => total + resource.transferSize, 0),
      inpMs: Number(lab.inp.toFixed(2)),
      initialJsTransferBytes: resources
        .filter((resource) => resource.initiatorType === "script")
        .reduce((total, resource) => total + resource.transferSize, 0),
      lcpMs: Number(lab.lcp.toFixed(2)),
      requestCount: resources.length + 1,
      transferredBytes: resources.reduce(
        (total, resource) => total + resource.transferSize,
        0,
      ),
      ttfbMs: Number((navigation.responseStart - navigation.requestStart).toFixed(2)),
      webVitals: window.__FAMILY_MONEY_WEB_VITALS__ ?? [],
    };
  });
}

export async function saveLabReport(
  filename: string,
  attachmentName: string,
  report: unknown,
  testInfo: TestInfo,
) {
  const body = `${JSON.stringify(report, null, 2)}\n`;
  await mkdir(performanceArtifactRoot, { recursive: true });
  await writeFile(path.join(performanceArtifactRoot, filename), body);
  await testInfo.attach(attachmentName, {
    body: Buffer.from(body),
    contentType: "application/json",
  });
}
