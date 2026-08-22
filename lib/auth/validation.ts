import { z } from "zod";

import { usernameSchema } from "@/lib/validation/common";

export const loginIdentifierSchema = z
  .string()
  .trim()
  .min(3, "Enter your username or email address.")
  .max(254, "The login identifier is too long.")
  .transform((value) => value.toLowerCase())
  .refine(
    (value) =>
      z.email().safeParse(value).success || usernameSchema.safeParse(value).success,
    "Enter a valid username or email address.",
  );

export const loginSchema = z.object({
  identifier: loginIdentifierSchema,
  password: z.string().min(1, "Enter your password.").max(128),
  remember: z.boolean(),
});

export const strongPasswordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128, "Use no more than 128 characters.")
  .regex(/[a-z]/, "Add a lowercase letter.")
  .regex(/[A-Z]/, "Add an uppercase letter.")
  .regex(/[0-9]/, "Add a number.")
  .regex(/[^A-Za-z0-9]/, "Add a symbol.");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().max(128).optional(),
    password: strongPasswordSchema,
    confirmation: z.string(),
  })
  .refine((value) => value.password === value.confirmation, {
    message: "The passwords do not match.",
    path: ["confirmation"],
  })
  .refine((value) => value.currentPassword !== value.password, {
    message: "Choose a password different from the temporary password.",
    path: ["password"],
  });

export const forgotPasswordSchema = z.object({
  identifier: loginIdentifierSchema,
});
