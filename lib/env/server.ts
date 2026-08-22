import { z } from "zod";

const serverEnvironmentSchema = z.object({
  SUPABASE_SECRET_KEY: z
    .string()
    .min(32)
    .refine(
      (value) => value.startsWith("sb_secret_") || value.startsWith("eyJ"),
      "Use a Supabase secret key or legacy service-role key.",
    ),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function readServerEnvironment() {
  return serverEnvironmentSchema.safeParse({
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });
}

export function hasServerEnvironment() {
  return readServerEnvironment().success;
}

export function getServerEnvironment(): ServerEnvironment {
  const result = readServerEnvironment();

  if (!result.success) {
    throw new Error("The server-only Supabase environment is not configured.");
  }

  return result.data;
}
