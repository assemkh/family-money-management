import { z } from "zod";

const supportedCurrencySchema = z.enum(["DZD", "EUR", "USD"]);

const amountSchema = z
  .string()
  .trim()
  .min(1, "Enter an amount.")
  .regex(/^\d{1,15}(?:[.,]\d{1,2})?$/, "Use a positive amount with up to 2 decimals.")
  .transform((value) => value.replace(",", "."))
  .refine((value) => Number(value) > 0, "Amount must be greater than zero.");

const noteSchema = z
  .string()
  .trim()
  .max(2000, "Keep the note under 2,000 characters.")
  .transform((value) => (value.length > 0 ? value : null));

const monthSchema = z
  .string()
  .regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, "Choose a valid month.")
  .transform((value) => `${value}-01`);

const dateSchema = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
}, "Choose a valid date.");

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

export type SupportedCurrency = z.infer<typeof supportedCurrencySchema>;
