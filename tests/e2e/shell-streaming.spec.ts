import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { projectHasCredentials } from "./support/credentials";
import { performanceArtifactRoot } from "./support/paths";

/**
 * Phase 2.A acceptance: the authenticated shell must reach the browser without
 * waiting for unrelated page data. This reads the raw HTML stream rather than the
 * rendered DOM, because a fast local server can resolve the page before a fallback
 * would ever paint — the stream still shows the ordering the contract depends on.
 */
const SHELL_MARKER = 'id="main-content"';
const FALLBACK_MARKER = "Loading family financial brief";
const CONTENT_MARKER = 'id="dashboard-kpis-heading"';

type StreamMark = {
  marker: string;
  elapsedMs: number;
  byteOffset: number;
  chunkIndex: number;
};

async function readStreamMarks(url: string, cookie: string, markers: string[]) {
  const startedAt = performance.now();
  const response = await fetch(url, { headers: { cookie } });
  expect(response.ok, `expected 200 from ${url}`).toBeTruthy();

  const body = response.body;
  expect(body, "expected a streaming response body").toBeTruthy();

  const decoder = new TextDecoder();
  const found = new Map<string, StreamMark>();
  let buffered = "";
  let bytes = 0;
  let chunkIndex = -1;
  let firstChunkMs: number | null = null;

  for await (const chunk of body as unknown as AsyncIterable<Uint8Array>) {
    chunkIndex += 1;
    firstChunkMs ??= Number((performance.now() - startedAt).toFixed(2));
    bytes += chunk.byteLength;
    buffered += decoder.decode(chunk, { stream: true });
    const elapsedMs = Number((performance.now() - startedAt).toFixed(2));

    for (const marker of markers) {
      if (!found.has(marker) && buffered.includes(marker)) {
        found.set(marker, {
          marker,
          elapsedMs,
          byteOffset: buffered.indexOf(marker),
          chunkIndex,
        });
      }
    }
  }

  return {
    firstChunkMs: firstChunkMs ?? 0,
    completeMs: Number((performance.now() - startedAt).toFixed(2)),
    totalBytes: bytes,
    marks: found,
  };
}

test.beforeEach(async ({}, testInfo) => {
  test.skip(
    !(await projectHasCredentials(testInfo.project.name)),
    "This role has no local fixture or explicit hosted E2E credentials.",
  );
});

test.describe("authenticated shell streaming", () => {
  test("the shell streams before dashboard data resolves", async ({
    context,
    baseURL,
  }) => {
    const cookie = (await context.cookies())
      .map((entry) => `${entry.name}=${entry.value}`)
      .join("; ");
    expect(cookie, "expected an authenticated session cookie").not.toBe("");

    const result = await readStreamMarks(`${baseURL}/dashboard`, cookie, [
      SHELL_MARKER,
      FALLBACK_MARKER,
      CONTENT_MARKER,
    ]);

    const shell = result.marks.get(SHELL_MARKER);
    const fallback = result.marks.get(FALLBACK_MARKER);
    const content = result.marks.get(CONTENT_MARKER);

    expect(shell, "the application shell must appear in the stream").toBeTruthy();
    expect(fallback, "the dashboard fallback must appear in the stream").toBeTruthy();
    expect(content, "the dashboard content must appear in the stream").toBeTruthy();

    // HTML order alone cannot prove streaming because one complete chunk has the same
    // marker order. Requiring an earlier network chunk protects the actual contract:
    // the shell and fallback reach the browser before data-dependent page content.
    expect(shell!.byteOffset).toBeLessThan(content!.byteOffset);
    expect(shell!.chunkIndex).toBeLessThan(content!.chunkIndex);
    expect(fallback!.chunkIndex).toBeLessThan(content!.chunkIndex);

    await mkdir(performanceArtifactRoot, { recursive: true });
    await writeFile(
      path.join(performanceArtifactRoot, "shell-streaming.json"),
      `${JSON.stringify(
        {
          route: "/dashboard",
          firstChunkMs: result.firstChunkMs,
          completeMs: result.completeMs,
          totalBytes: result.totalBytes,
          shellMs: shell!.elapsedMs,
          shellByteOffset: shell!.byteOffset,
          shellChunkIndex: shell!.chunkIndex,
          fallbackMs: fallback!.elapsedMs,
          fallbackByteOffset: fallback!.byteOffset,
          fallbackChunkIndex: fallback!.chunkIndex,
          contentMs: content!.elapsedMs,
          contentByteOffset: content!.byteOffset,
          contentChunkIndex: content!.chunkIndex,
          fallbackStreamedBeforeContent: fallback!.chunkIndex < content!.chunkIndex,
        },
        null,
        2,
      )}\n`,
    );
  });
});
