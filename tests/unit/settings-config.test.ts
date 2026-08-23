import { describe, expect, it } from "vitest";

import {
  defaultAllocationDefaults,
  defaultDashboardPreferences,
  defaultFinancialHealthSettings,
  parseAllocationDefaults,
  parseDashboardPreferences,
  parseFinancialHealthSettings,
} from "@/lib/settings/config";
import {
  allocationDefaultsSchema,
  categorySettingsSchema,
  categoryUpdateSchema,
  dashboardPreferencesSchema,
  financialHealthSettingsSchema,
  incomeSourceSettingsSchema,
  incomeSourceUpdateSchema,
  managementStatusSchema,
  memberPasswordResetSchema,
  memberProfileUpdateSchema,
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

  it("validates category names, hierarchy identifiers, types, and display order", () => {
    expect(
      categorySettingsSchema.safeParse({
        name: "  School  ",
        type: "essentials",
        parentCategoryId: "",
        sortOrder: "120",
      }),
    ).toMatchObject({
      success: true,
      data: {
        name: "School",
        parentCategoryId: null,
        sortOrder: 120,
      },
    });
    expect(
      categorySettingsSchema.safeParse({
        name: "School",
        type: "not-a-category",
        parentCategoryId: "bad-id",
        sortOrder: "-1",
      }).success,
    ).toBe(false);
    expect(
      categoryUpdateSchema.safeParse({
        id: "bad-id",
        name: "School",
        type: "essentials",
        parentCategoryId: "",
        sortOrder: "1",
      }).success,
    ).toBe(false);
  });

  it("validates income-source ownership and update identifiers", () => {
    const memberId = "31000000-0000-4000-8000-000000000001";
    expect(
      incomeSourceSettingsSchema.safeParse({
        name: "Salary",
        ownerMemberId: memberId,
        sortOrder: "10",
      }),
    ).toMatchObject({
      success: true,
      data: { ownerMemberId: memberId, sortOrder: 10 },
    });
    expect(
      incomeSourceUpdateSchema.safeParse({
        id: "not-a-uuid",
        name: "Salary",
        ownerMemberId: "",
        sortOrder: "10",
      }).success,
    ).toBe(false);
  });

  it("only accepts explicit archive and restore status values", () => {
    const id = "31000000-0000-4000-8000-000000000001";
    expect(managementStatusSchema.parse({ id, active: "true" }).active).toBe(true);
    expect(managementStatusSchema.parse({ id, active: "false" }).active).toBe(false);
    expect(managementStatusSchema.safeParse({ id, active: "1" }).success).toBe(false);
  });

  it("parses complete dashboard preferences and repairs invalid stored fields", () => {
    expect(
      parseDashboardPreferences({
        kpiMode: "compact",
        defaultMonth: "previous",
        trendRange: 12,
        showHealth: false,
        showPlan: true,
        showBreakdowns: false,
        showNetWorth: true,
        showGoals: false,
      }),
    ).toEqual({
      kpiMode: "compact",
      defaultMonth: "previous",
      trendRange: 12,
      showHealth: false,
      showPlan: true,
      showBreakdowns: false,
      showNetWorth: true,
      showGoals: false,
    });
    expect(parseDashboardPreferences({ trendRange: 7 })).toEqual(
      defaultDashboardPreferences,
    );
  });

  it("validates dashboard preference form values before saving", () => {
    expect(
      dashboardPreferencesSchema.safeParse({
        kpiMode: "full",
        defaultMonth: "current",
        trendRange: "3",
        showHealth: true,
        showPlan: true,
        showBreakdowns: true,
        showNetWorth: true,
        showGoals: true,
      }).success,
    ).toBe(true);
    expect(
      dashboardPreferencesSchema.safeParse({
        kpiMode: "dense",
        defaultMonth: "current",
        trendRange: "18",
        showHealth: true,
        showPlan: true,
        showBreakdowns: true,
        showNetWorth: true,
        showGoals: true,
      }).success,
    ).toBe(false);
  });

  it("validates member profile and temporary-password administration", () => {
    const id = "51000000-0000-4000-8000-000000000002";
    expect(
      memberProfileUpdateSchema.parse({ id, displayName: "  Family Member  " }),
    ).toEqual({ id, displayName: "Family Member" });
    expect(memberProfileUpdateSchema.safeParse({ id, displayName: "" }).success).toBe(
      false,
    );
    expect(
      memberPasswordResetSchema.safeParse({
        id,
        temporaryPassword: "NewSecure1!",
      }).success,
    ).toBe(true);
    expect(
      memberPasswordResetSchema.safeParse({
        id,
        temporaryPassword: "weak",
      }).success,
    ).toBe(false);
  });
});
