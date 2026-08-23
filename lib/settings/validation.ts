import { z } from "zod";

const percentageInput = z
  .string()
  .trim()
  .min(1, "Enter a percentage.")
  .regex(/^\d{1,3}(?:[.,]\d{1,2})?$/, "Use a percentage with up to 2 decimals.")
  .transform((value) => Number(value.replace(",", ".")))
  .refine((value) => value <= 100, "Percentage cannot exceed 100%.");

export const familySettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a family name.")
    .max(100, "Keep the family name under 100 characters."),
  baseCurrency: z.literal("DZD"),
  timezone: z.literal("Africa/Algiers"),
  locale: z.enum(["en", "ar"]),
  dateFormat: z.enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"]),
});

export const allocationDefaultsSchema = z
  .object({
    essentials: percentageInput,
    personal: percentageInput,
    savings: percentageInput,
    investment: percentageInput,
    reserve: percentageInput,
  })
  .superRefine((value, context) => {
    const total = Object.values(value).reduce((sum, percentage) => sum + percentage, 0);
    if (Math.abs(total - 100) > 0.000001) {
      context.addIssue({
        code: "custom",
        path: ["allocationTotal"],
        message: `Defaults total ${total.toFixed(2)}%. They must equal exactly 100%.`,
      });
    }
  });

export const financialHealthSettingsSchema = z
  .object({
    positiveSavingRate: percentageInput,
    neutralSavingRate: percentageInput,
    positivePlanVariancePercent: percentageInput,
    warningPlanVariancePercent: percentageInput,
    essentialsWarningRatio: percentageInput,
    positiveInvestmentRate: percentageInput,
    debtWarningRatio: percentageInput,
    goalProgressTarget: percentageInput,
  })
  .superRefine((value, context) => {
    if (value.neutralSavingRate > value.positiveSavingRate) {
      context.addIssue({
        code: "custom",
        path: ["neutralSavingRate"],
        message: "The watch level cannot exceed the healthy saving rate.",
      });
    }
    if (value.positivePlanVariancePercent > value.warningPlanVariancePercent) {
      context.addIssue({
        code: "custom",
        path: ["positivePlanVariancePercent"],
        message: "The aligned gap cannot exceed the warning gap.",
      });
    }
  });
