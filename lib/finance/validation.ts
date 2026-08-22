import { z } from "zod";

import { strongPasswordSchema } from "@/lib/auth/validation";
import { usernameSchema } from "@/lib/validation/common";

const supportedCurrencySchema = z.enum(["DZD", "EUR", "USD"]);

const amountSchema = z
  .string()
  .trim()
  .min(1, "Enter an amount.")
  .regex(/^\d{1,15}(?:[.,]\d{1,2})?$/, "Use a positive amount with up to 2 decimals.")
  .transform((value) => value.replace(",", "."))
  .refine((value) => Number(value) > 0, "Amount must be greater than zero.");

const balanceSchema = z
  .string()
  .trim()
  .min(1, "Enter the current balance.")
  .regex(
    /^\d{1,15}(?:[.,]\d{1,2})?$/,
    "Use a non-negative balance with up to 2 decimals.",
  )
  .transform((value) => value.replace(",", "."));

const exchangeRateSchema = z
  .string()
  .trim()
  .min(1, "Enter an exchange rate.")
  .regex(/^\d{1,9}(?:[.,]\d{1,6})?$/, "Use a positive rate with up to 6 decimals.")
  .transform((value) => value.replace(",", "."))
  .refine((value) => Number(value) > 0, "Rate must be greater than zero.");

const noteSchema = z
  .string()
  .trim()
  .max(2000, "Keep the note under 2,000 characters.")
  .transform((value) => (value.length > 0 ? value : null));

const nameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name.")
  .max(100, "Keep the name under 100 characters.");

const shortTypeSchema = z
  .string()
  .trim()
  .min(1, "Enter a type.")
  .max(60, "Keep the type under 60 characters.");

const optionalAmountSchema = z.preprocess(
  (value) => (value === "" || value === null ? null : value),
  amountSchema.nullable(),
);

const monthSchema = z
  .string()
  .regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, "Choose a valid month.")
  .transform((value) => `${value}-01`);

const percentageSchema = z
  .string()
  .trim()
  .min(1, "Enter a percentage.")
  .regex(/^\d{1,3}(?:[.,]\d{1,2})?$/, "Use a percentage with up to 2 decimals.")
  .transform((value) => value.replace(",", "."))
  .refine((value) => Number(value) <= 100, "Percentage cannot exceed 100.");

const dateSchema = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
}, "Choose a valid date.");

const optionalDateSchema = z.preprocess(
  (value) => (value === "" || value === null ? null : value),
  dateSchema.nullable(),
);

const optionalUuidSchema = z.preprocess(
  (value) => (value === "" || value === null ? null : value),
  z.uuid("Choose a valid account.").nullable(),
);

export const incomeEntrySchema = z.object({
  sourceId: z.uuid("Choose an income source."),
  month: monthSchema,
  amount: amountSchema,
  currency: supportedCurrencySchema,
  note: noteSchema,
});

export const expenseEntrySchema = z.object({
  categoryId: z.uuid("Choose a category."),
  transactionDate: dateSchema,
  amount: amountSchema,
  currency: supportedCurrencySchema,
  accountId: optionalUuidSchema,
  note: noteSchema,
});

export const accountBalanceSchema = z.object({
  accountId: z.uuid("Choose a valid account."),
  balance: balanceSchema,
});

export const transferEntrySchema = z
  .object({
    fromAccountId: z.uuid("Choose a source account."),
    toAccountId: z.uuid("Choose a destination account."),
    transferDate: dateSchema,
    amount: amountSchema,
    note: noteSchema,
  })
  .refine((value) => value.fromAccountId !== value.toAccountId, {
    path: ["toAccountId"],
    message: "Choose a different destination account.",
  });

export const manualExchangeRateSchema = z.object({
  currency: z.enum(["EUR", "USD"]),
  rate: exchangeRateSchema,
  effectiveDate: dateSchema,
});

export const monthlyPlanSchema = z
  .object({
    month: monthSchema,
    reason: z
      .string()
      .trim()
      .min(1, "Explain why this plan or revision is being created.")
      .max(500, "Keep the reason under 500 characters."),
    essentialsPercent: percentageSchema,
    personalPercent: percentageSchema,
    savingsPercent: percentageSchema,
    investmentPercent: percentageSchema,
    reservePercent: percentageSchema,
  })
  .superRefine((value, context) => {
    const total =
      Number(value.essentialsPercent) +
      Number(value.personalPercent) +
      Number(value.savingsPercent) +
      Number(value.investmentPercent) +
      Number(value.reservePercent);
    if (Math.abs(total - 100) > 0.000001) {
      context.addIssue({
        code: "custom",
        path: ["allocationTotal"],
        message: `Allocation totals ${total.toFixed(2)}%. It must equal exactly 100%.`,
      });
    }
  });

export const savingsGoalSchema = z.object({
  name: nameSchema,
  targetAmount: amountSchema,
  currency: supportedCurrencySchema,
  targetDate: optionalDateSchema,
  priority: z.coerce
    .number()
    .int("Choose a whole-number priority.")
    .min(1, "Priority must be between 1 and 5.")
    .max(5, "Priority must be between 1 and 5."),
  note: noteSchema,
});

export const savingContributionSchema = z.object({
  goalId: z.preprocess(
    (value) => (value === "" || value === null ? null : value),
    z.uuid("Choose a valid savings goal.").nullable(),
  ),
  transactionDate: dateSchema,
  amount: amountSchema,
  currency: supportedCurrencySchema,
  note: noteSchema,
});

export const savingsGoalStatusSchema = z.object({
  goalId: z.uuid("Choose a valid savings goal."),
  status: z.enum(["active", "paused", "cancelled"]),
});

export const householdMemberSchema = z.object({
  displayName: nameSchema,
  username: usernameSchema
    .transform((value) => value.toLowerCase())
    .refine((value) => /^[a-z0-9]/.test(value), {
      message: "Username must start with a letter or number.",
    }),
  email: z
    .email("Enter a valid email address.")
    .transform((value) => value.toLowerCase()),
  temporaryPassword: strongPasswordSchema,
});

export const assetEntrySchema = z.object({
  name: nameSchema,
  assetType: z.enum(["gold", "other"]),
  purchaseValue: balanceSchema,
  currentValue: balanceSchema,
  currency: supportedCurrencySchema,
  purchaseDate: optionalDateSchema,
  note: noteSchema,
});

export const investmentEntrySchema = z.object({
  name: nameSchema,
  type: shortTypeSchema,
  purchaseValue: balanceSchema,
  currentValue: balanceSchema,
  currency: supportedCurrencySchema,
  purchaseDate: optionalDateSchema,
  note: noteSchema,
});

export const liabilityEntrySchema = z
  .object({
    name: nameSchema,
    type: shortTypeSchema,
    originalAmount: amountSchema,
    paidAmount: balanceSchema,
    monthlyPayment: optionalAmountSchema,
    currency: supportedCurrencySchema,
    dueDate: optionalDateSchema,
    note: noteSchema,
  })
  .refine((value) => Number(value.paidAmount) <= Number(value.originalAmount), {
    path: ["paidAmount"],
    message: "Paid amount cannot exceed the original amount.",
  });

export const recurringEntrySchema = z
  .object({
    name: nameSchema,
    type: z.enum(["income", "expense", "savings", "investment", "liability_payment"]),
    categoryId: optionalUuidSchema,
    amount: amountSchema,
    currency: supportedCurrencySchema,
    frequency: z.enum(["weekly", "monthly", "yearly", "custom"]),
    customIntervalDays: z.preprocess(
      (value) => (value === "" || value === null ? null : value),
      z.coerce.number().int().min(1).max(3650).nullable(),
    ),
    nextDueDate: dateSchema,
    note: noteSchema,
  })
  .superRefine((value, context) => {
    if (value.frequency === "custom" && !value.customIntervalDays) {
      context.addIssue({
        code: "custom",
        path: ["customIntervalDays"],
        message: "Enter the number of days for a custom schedule.",
      });
    }
    if (value.frequency !== "custom" && value.customIntervalDays) {
      context.addIssue({
        code: "custom",
        path: ["customIntervalDays"],
        message: "Custom days are only used with a custom schedule.",
      });
    }
  });

export type SupportedCurrency = z.infer<typeof supportedCurrencySchema>;
