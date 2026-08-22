import { describe, expect, it } from "vitest";

import { expenseEntrySchema, incomeEntrySchema } from "@/lib/finance/validation";

const uuid = "11111111-1111-4111-8111-111111111111";

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
});
