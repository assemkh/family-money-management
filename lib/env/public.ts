import { z } from "zod";

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;

function environmentCandidate() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  };
}

export function readPublicEnvironment() {
  return publicEnvironmentSchema.safeParse(environmentCandidate());
}

export function hasSupabaseEnvironment() {
  return readPublicEnvironment().success;
}

export function getPublicEnvironment(): PublicEnvironment {
  const result = readPublicEnvironment();

  if (!result.success) {
    throw new Error("The public Supabase environment is not configured.");
  }

  return result.data;
}
