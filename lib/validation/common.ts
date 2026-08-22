import { z } from "zod";

export const currencyCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Z]{3}$/, "Use a valid three-letter currency code.");

export const positiveMoneyAmountSchema = z.coerce
  .number()
  .finite()
  .positive("Amount must be greater than zero.");

export const monthKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-01$/, "Use the first day of the month.");

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must contain at least 3 characters.")
  .max(32, "Username must contain at most 32 characters.")
  .regex(
    /^[a-z0-9._-]+$/i,
    "Username may only contain letters, numbers, dots, dashes, and underscores.",
  );
