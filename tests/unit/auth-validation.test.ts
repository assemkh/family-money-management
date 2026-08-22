import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  strongPasswordSchema,
} from "@/lib/auth/validation";

describe("authentication validation", () => {
  it("normalizes usernames before server-side identity resolution", () => {
    const result = loginSchema.parse({
      username: "AssemKH",
      password: "temporary-password",
      remember: true,
    });

    expect(result.username).toBe("assemkh");
  });

  it("never accepts an empty login password", () => {
    expect(
      loginSchema.safeParse({ username: "assemkh", password: "", remember: false })
        .success,
    ).toBe(false);
  });

  it("requires a strong replacement password", () => {
    expect(strongPasswordSchema.safeParse("justlowercase").success).toBe(false);
    expect(strongPasswordSchema.safeParse("NewFamily#2026").success).toBe(true);
  });

  it("requires matching replacement passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "temporary-password",
      password: "NewFamily#2026",
      confirmation: "Different#2026",
    });

    expect(result.success).toBe(false);
  });

  it("supports recovery without exposing an email field", () => {
    const result = forgotPasswordSchema.parse({ username: "ASSEMkh" });

    expect(result).toEqual({ username: "assemkh" });
  });
});
