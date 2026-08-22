import { describe, expect, it } from "vitest";

import {
  accountBalanceSchema,
  assetEntrySchema,
  expenseEntrySchema,
  householdMemberSchema,
  incomeEntrySchema,
  investmentEventSchema,
  liabilityEntrySchema,
  manualExchangeRateSchema,
  monthlyPlanSchema,
  netWorthSnapshotSchema,
  recurringEntrySchema,
  savingContributionSchema,
  savingsGoalSchema,
  savingsGoalStatusSchema,
  transferEntrySchema,
} from "@/lib/finance/validation";

const uuid = "11111111-1111-4111-8111-111111111111";
const secondUuid = "22222222-2222-4222-8222-222222222222";

describe("finance entry validation", () => {
  it("normalizes a valid income amount and month", () => {
    const result = incomeEntrySchema.parse({
      sourceId: uuid,
      month: "2026-08",
      amount: "125000,50",
      currency: "DZD",
      note: "  Salary  ",
    });

    expect(result).toEqual({
      sourceId: uuid,
      month: "2026-08-01",
      amount: "125000.50",
      currency: "DZD",
      note: "Salary",
    });
  });

  it("accepts an expense without an account", () => {
    const result = expenseEntrySchema.parse({
      categoryId: uuid,
      transactionDate: "2026-08-22",
      amount: "340",
      currency: "DZD",
      accountId: "",
      note: "",
    });

    expect(result.accountId).toBeNull();
    expect(result.note).toBeNull();
  });

  it.each(["0", "-10", "12.345", "not-money"])(
    "rejects invalid amount %s",
    (amount) => {
      const result = expenseEntrySchema.safeParse({
        categoryId: uuid,
        transactionDate: "2026-08-22",
        amount,
        currency: "DZD",
        accountId: "",
        note: "",
      });

      expect(result.success).toBe(false);
    },
  );

  it.each(["2026-02-30", "2026-13-01", "22-08-2026"])(
    "rejects invalid date %s",
    (transactionDate) => {
      const result = expenseEntrySchema.safeParse({
        categoryId: uuid,
        transactionDate,
        amount: "10",
        currency: "DZD",
        accountId: "",
        note: "",
      });

      expect(result.success).toBe(false);
    },
  );

  it("accepts a zero account balance but rejects negative balances", () => {
    expect(accountBalanceSchema.parse({ accountId: uuid, balance: "0" }).balance).toBe(
      "0",
    );
    expect(
      accountBalanceSchema.safeParse({ accountId: uuid, balance: "-1" }).success,
    ).toBe(false);
  });

  it("requires two different accounts for a transfer", () => {
    const validTransfer = {
      fromAccountId: uuid,
      toAccountId: secondUuid,
      transferDate: "2026-08-22",
      amount: "100",
      note: "Cash to CCP",
    };

    expect(transferEntrySchema.safeParse(validTransfer).success).toBe(true);
    expect(
      transferEntrySchema.safeParse({ ...validTransfer, toAccountId: uuid }).success,
    ).toBe(false);
  });

  it("normalizes a valid manual exchange rate", () => {
    expect(
      manualExchangeRateSchema.parse({
        currency: "EUR",
        rate: "251,123456",
        effectiveDate: "2026-08-22",
      }).rate,
    ).toBe("251.123456");
  });

  it("accepts a gold asset with purchase and current values", () => {
    expect(
      assetEntrySchema.safeParse({
        name: "Gold bracelet",
        assetType: "gold",
        purchaseValue: "100000",
        currentValue: "125000",
        currency: "DZD",
        purchaseDate: "2026-08-01",
        note: "",
      }).success,
    ).toBe(true);
  });

  it("normalizes a household username and enforces the database prefix", () => {
    const member = {
      displayName: "Wife",
      username: "Wife.User",
      email: "WIFE@example.com",
      temporaryPassword: "StrongPass1!",
    };
    expect(householdMemberSchema.parse(member)).toMatchObject({
      username: "wife.user",
      email: "wife@example.com",
    });
    expect(
      householdMemberSchema.safeParse({ ...member, username: "_wife" }).success,
    ).toBe(false);
  });

  it("prevents liabilities from starting overpaid", () => {
    expect(
      liabilityEntrySchema.safeParse({
        name: "Loan",
        type: "loan",
        originalAmount: "1000",
        paidAmount: "1001",
        monthlyPayment: "",
        currency: "DZD",
        dueDate: "",
        note: "",
      }).success,
    ).toBe(false);
  });

  it("requires an interval only for custom recurring schedules", () => {
    const base = {
      name: "Rent",
      type: "expense",
      categoryId: "",
      amount: "100",
      currency: "DZD",
      nextDueDate: "2026-09-01",
      note: "",
    };
    expect(
      recurringEntrySchema.safeParse({
        ...base,
        frequency: "monthly",
        customIntervalDays: "",
      }).success,
    ).toBe(true);
    expect(
      recurringEntrySchema.safeParse({
        ...base,
        frequency: "custom",
        customIntervalDays: "",
      }).success,
    ).toBe(false);
  });

  it("accepts only monthly plans that total exactly 100 percent", () => {
    const plan = {
      month: "2026-09",
      reason: "Initial plan",
      essentialsPercent: "50",
      personalPercent: "10",
      savingsPercent: "20",
      investmentPercent: "15",
      reservePercent: "5",
    };
    expect(monthlyPlanSchema.parse(plan).month).toBe("2026-09-01");
    expect(
      monthlyPlanSchema.safeParse({ ...plan, essentialsPercent: "51" }).success,
    ).toBe(false);
  });

  it("requires a reason for every monthly plan version", () => {
    expect(
      monthlyPlanSchema.safeParse({
        month: "2026-09",
        reason: "",
        essentialsPercent: "50",
        personalPercent: "10",
        savingsPercent: "20",
        investmentPercent: "15",
        reservePercent: "5",
      }).success,
    ).toBe(false);
  });

  it("normalizes a savings goal and allows a flexible target date", () => {
    expect(
      savingsGoalSchema.parse({
        name: "  Emergency fund  ",
        targetAmount: "250000,50",
        currency: "DZD",
        targetDate: "",
        priority: "1",
        note: "  Six months of essentials  ",
      }),
    ).toEqual({
      name: "Emergency fund",
      targetAmount: "250000.50",
      currency: "DZD",
      targetDate: null,
      priority: 1,
      note: "Six months of essentials",
    });
  });

  it("accepts general savings and validates an assigned goal", () => {
    const contribution = {
      transactionDate: "2026-08-23",
      amount: "10000",
      currency: "DZD",
      note: "Salary transfer",
    };

    expect(
      savingContributionSchema.parse({ ...contribution, goalId: "" }).goalId,
    ).toBeNull();
    expect(
      savingContributionSchema.safeParse({ ...contribution, goalId: "not-a-goal" })
        .success,
    ).toBe(false);
  });

  it("limits goal status controls to non-completed workflow states", () => {
    expect(
      savingsGoalStatusSchema.safeParse({ goalId: uuid, status: "paused" }).success,
    ).toBe(true);
    expect(
      savingsGoalStatusSchema.safeParse({ goalId: uuid, status: "completed" }).success,
    ).toBe(false);
  });

  it("accepts an explicit investment event tied to a position", () => {
    expect(
      investmentEventSchema.parse({
        investmentId: uuid,
        transactionDate: "2026-08-23",
        amount: "12500,50",
        currency: "DZD",
        note: "Monthly ETF purchase",
      }),
    ).toEqual({
      investmentId: uuid,
      transactionDate: "2026-08-23",
      amount: "12500.50",
      currency: "DZD",
      note: "Monthly ETF purchase",
    });
  });

  it("normalizes a net-worth snapshot month", () => {
    expect(netWorthSnapshotSchema.parse({ month: "2026-08" })).toEqual({
      month: "2026-08-01",
    });
    expect(netWorthSnapshotSchema.safeParse({ month: "2026-13" }).success).toBe(false);
  });
});
