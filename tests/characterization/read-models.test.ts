import { beforeAll, describe, expect, it, vi } from "vitest";

import { getDirection, getMessages } from "@/lib/i18n/config";

import { characterizationClient, FIXTURE, normalizeDates } from "./support/context";

vi.mock("server-only", () => ({}));
vi.mock("react", async () => {
  const react = await vi.importActual<typeof import("react")>("react");
  return { ...react, cache: <T>(fn: T) => fn };
});
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`Unexpected redirect to ${path} during characterization`);
  },
}));

const db = characterizationClient();
const context = {
  userId: FIXTURE.ownerId,
  householdId: FIXTURE.householdId,
  member: {
    id: FIXTURE.ownerId,
    displayName: "Characterization Owner",
    username: "phase2b_owner",
    role: "owner" as const,
    mustChangePassword: false,
  },
  locale: "en" as const,
  direction: getDirection("en"),
  messages: getMessages("en"),
  db,
};

vi.mock("@/lib/auth/household-context", () => ({
  readHouseholdContext: async () => context,
  requireHouseholdContext: async () => context,
}));

const cashFlow = {
  income: await import("@/lib/finance/read-models/cash-flow/income"),
  expenses: await import("@/lib/finance/read-models/cash-flow/expenses"),
  transfers: await import("@/lib/finance/read-models/cash-flow/transfers"),
};
const netWorth = {
  accounts: await import("@/lib/finance/read-models/net-worth/accounts"),
  portfolio: await import("@/lib/finance/read-models/net-worth/portfolio"),
  liabilities: await import("@/lib/finance/read-models/net-worth/liabilities"),
  page: await import("@/lib/finance/read-models/net-worth/page"),
};
const planning = {
  monthlyPlan: await import("@/lib/finance/read-models/planning/monthly-plan"),
  recurring: await import("@/lib/finance/read-models/planning/recurring"),
  goals: await import("@/lib/finance/read-models/planning/goals"),
};
const dashboard = await import("@/lib/finance/read-models/dashboard/page");
const reports = await import("@/lib/finance/read-models/reports/page");
const settingsModule = await import("@/lib/settings/data");

beforeAll(async () => {
  const { count, error } = await db
    .from("income_entries")
    .select("id", { count: "exact", head: true })
    .eq("family_id", FIXTURE.householdId);
  if (error || !count) {
    throw new Error(
      "The characterization Household is missing. Run `npm run test:read-models`.",
    );
  }
});

/**
 * One snapshot per page-facing read model. These are the fixtures Phase 2.B's
 * acceptance criterion refers to: extracting the domain Modules must leave every
 * financial total, ordering, and null exactly as it is here.
 */
describe("cash flow read models", () => {
  it("income page", async () => {
    expect(normalizeDates(await cashFlow.income.getIncomePageData())).toMatchSnapshot();
  });

  it("expense page", async () => {
    expect(
      normalizeDates(await cashFlow.expenses.getExpensePageData()),
    ).toMatchSnapshot();
  });

  it("transfers page", async () => {
    expect(
      normalizeDates(await cashFlow.transfers.getTransfersPageData()),
    ).toMatchSnapshot();
  });
});

describe("net worth read models", () => {
  it("accounts page", async () => {
    expect(
      normalizeDates(await netWorth.accounts.getAccountsPageData()),
    ).toMatchSnapshot();
  });

  it("assets page", async () => {
    expect(normalizeDates(await netWorth.portfolio.readAssetsPage())).toMatchSnapshot();
  });

  it("investments page", async () => {
    expect(
      normalizeDates(await netWorth.portfolio.getInvestmentPageData()),
    ).toMatchSnapshot();
  });

  it("liabilities page", async () => {
    expect(
      normalizeDates(await netWorth.liabilities.getLiabilitiesPageData()),
    ).toMatchSnapshot();
  });

  it("net worth page", async () => {
    expect(normalizeDates(await netWorth.page.getNetWorthPageData())).toMatchSnapshot();
  });
});

describe("planning read models", () => {
  it("monthly plan page", async () => {
    expect(
      normalizeDates(await planning.monthlyPlan.getMonthlyPlanPageData()),
    ).toMatchSnapshot();
  });

  it("recurring page", async () => {
    expect(
      normalizeDates(await planning.recurring.getRecurringPageData()),
    ).toMatchSnapshot();
  });

  it("savings goals page", async () => {
    expect(
      normalizeDates(await planning.goals.getSavingsGoalsPageData()),
    ).toMatchSnapshot();
  });
});

describe("composed read models", () => {
  it("dashboard page", async () => {
    expect(normalizeDates(await dashboard.getDashboardPageData())).toMatchSnapshot();
  });

  it("reports page", async () => {
    expect(normalizeDates(await reports.getReportsPageData())).toMatchSnapshot();
  });

  it("report activity export", async () => {
    expect(
      normalizeDates(await reports.getReportActivityExportData({ period: "year" })),
    ).toMatchSnapshot();
  });

  it("settings page", async () => {
    expect(
      normalizeDates(await settingsModule.getSettingsPageData()),
    ).toMatchSnapshot();
  });
});
