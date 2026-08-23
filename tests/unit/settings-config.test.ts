import { describe, expect, it } from "vitest";

import {
  defaultAllocationDefaults,
  defaultFinancialHealthSettings,
  parseAllocationDefaults,
  parseFinancialHealthSettings,
} from "@/lib/settings/config";
import {
  allocationDefaultsSchema,
  financialHealthSettingsSchema,
} from "@/lib/settings/validation";

describe("settings configuration", () => {
  it("accepts a balanced custom default allocation", () => {
    expect(
      parseAllocationDefaults({
        essentials: 45,
        personal: 10,
        savings: 25,
        investment: 15,
        reserve: 5,
      }),
    ).toEqual({
      essentials: 45,
      personal: 10,
      savings: 25,
      investment: 15,
      reserve: 5,
    });
  });

  it("falls back safely when stored allocation JSON is incomplete or unbalanced", () => {
    expect(parseAllocationDefaults({ essentials: 90 })).toEqual(
      defaultAllocationDefaults,
    );
    expect(parseAllocationDefaults("invalid")).toEqual(defaultAllocationDefaults);
  });

  it("accepts ordered health bands and rejects contradictory stored values", () => {
    const custom = {
      ...defaultFinancialHealthSettings,
      neutralSavingRate: 12,
      positiveSavingRate: 24,
      positivePlanVariance: 0.08,
      warningPlanVariance: 0.2,
    };
    expect(parseFinancialHealthSettings(custom)).toEqual(custom);
    expect(
      parseFinancialHealthSettings({
        ...custom,
        neutralSavingRate: 30,
      }),
    ).toEqual(defaultFinancialHealthSettings);
  });

  it("validates settings form percentages before database writes", () => {
    expect(
      allocationDefaultsSchema.safeParse({
        essentials: "50",
        personal: "10",
        savings: "20",
        investment: "15",
        reserve: "5",
      }).success,
    ).toBe(true);
    expect(
      allocationDefaultsSchema.safeParse({
        essentials: "60",
        personal: "10",
        savings: "20",
        investment: "15",
        reserve: "5",
      }).success,
    ).toBe(false);
    expect(
      financialHealthSettingsSchema.safeParse({
        positiveSavingRate: "20",
        neutralSavingRate: "25",
        positivePlanVariancePercent: "10",
        warningPlanVariancePercent: "25",
        essentialsWarningRatio: "60",
        positiveInvestmentRate: "10",
        debtWarningRatio: "30",
        goalProgressTarget: "75",
      }).success,
    ).toBe(false);
  });
});
