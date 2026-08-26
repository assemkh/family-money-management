import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type TestInfo } from "@playwright/test";

export async function expectNoSeriousAccessibilityViolations(
  page: Page,
  testInfo: TestInfo,
  label: string,
  allowedNodeCounts: Record<string, number> = {},
) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );

  await testInfo.attach(`${label}-axe`, {
    body: Buffer.from(JSON.stringify(results, null, 2)),
    contentType: "application/json",
  });

  // Phase 1.A records existing debt by rule and node count. A test still fails
  // when a new serious rule appears or an allowed rule affects more nodes.
  const regressions = blocking.filter(
    (violation) => violation.nodes.length > (allowedNodeCounts[violation.id] ?? 0),
  );
  const summary = regressions
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.nodes
          .flatMap((node) => node.target)
          .join(", ")}`,
    )
    .join("\n");

  expect(
    regressions,
    summary || `${label} has no serious accessibility regressions`,
  ).toEqual([]);
}
