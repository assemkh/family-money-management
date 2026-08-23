import { describe, expect, it } from "vitest";

import {
  calculateAveragePlanVariance,
  calculateDzdTotal,
  calculateGain,
  calculateLiabilityRemaining,
  calculateMonthlyFlow,
  calculatePercentageBreakdown,
  calculatePlannedAmount,
  convertToDzd,
} from "@/lib/finance/calculations";

describe("finance calculations", () => {
  it("keeps DZD values unchanged", () => {
    expect(convertToDzd(320000, "DZD", {})).toBe(320000);
  });

  it("converts foreign currency using only manual rates", () => {
    expect(convertToDzd(100, "EUR", { EUR: 250 })).toBe(25000);
    expect(convertToDzd(50, "USD", { USD: 220 })).toBe(11000);
  });

  it("does not invent a conversion when a rate is missing", () => {
    expect(convertToDzd(100, "EUR", {})).toBeNull();
  });

  it("calculates gold and investment gain with zero protection", () => {
    expect(calculateGain(150000, 100000)).toEqual({
      gain: 50000,
      returnPercentage: 50,
    });
    expect(calculateGain(100, 0)).toEqual({ gain: 100, returnPercentage: null });
  });

  it("calculates remaining liability without going below zero", () => {
    expect(calculateLiabilityRemaining(100000, 25000)).toBe(75000);
    expect(calculateLiabilityRemaining(100000, 120000)).toBe(0);
  });

  it("totals mixed currencies and reports every missing manual rate", () => {
    expect(
      calculateDzdTotal(
        [
          { amount: 1000, currency: "DZD" },
          { amount: 10, currency: "EUR" },
          { amount: 5, currency: "USD" },
        ],
        { EUR: 250 },
      ),
    ).toEqual({ total: 3500, missingCurrencies: ["USD"], complete: false });
  });

  it("derives planned DZD amounts from actual income", () => {
    expect(calculatePlannedAmount(200000, 15)).toBe(30000);
  });

  it("reconciles explicit savings and investments separately from spending", () => {
    expect(
      calculateMonthlyFlow({
        income: 200000,
        expenses: 120000,
        savings: 30000,
        investments: 20000,
      }),
    ).toEqual({ remaining: 30000, savingRate: 25 });
  });

  it("builds chart percentages from raw amounts and removes empty slices", () => {
    expect(
      calculatePercentageBreakdown([
        { key: "personal", amount: 20000 },
        { key: "empty", amount: 0 },
        { key: "essentials", amount: 80000 },
      ]),
    ).toEqual([
      { key: "essentials", amount: 80000, percentage: 80 },
      { key: "personal", amount: 20000, percentage: 20 },
    ]);
  });

  it("calculates average absolute plan variance from comparable rows", () => {
    expect(
      calculateAveragePlanVariance([
        { planned: 100, actual: 110 },
        { planned: 200, actual: 160 },
        { planned: null, actual: 50 },
      ]),
    ).toBeCloseTo(0.15);
    expect(calculateAveragePlanVariance([{ planned: null, actual: 10 }])).toBeNull();
  });
});
