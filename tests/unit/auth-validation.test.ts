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
      identifier: "AssemKH",
      password: "temporary-password",
      remember: true,
    });

    expect(result.identifier).toBe("assemkh");
  });

  it("accepts and normalizes an email login identifier", () => {
    const result = loginSchema.parse({
      identifier: "Owner@Example.com",
      password: "temporary-password",
      remember: true,
    });

    expect(result.identifier).toBe("owner@example.com");
  });

  it("never accepts an empty login password", () => {
    expect(
      loginSchema.safeParse({
        identifier: "assemkh",
        password: "",
        remember: false,
      }).success,
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

  it("supports recovery by username", () => {
    const result = forgotPasswordSchema.parse({ identifier: "ASSEMkh" });

    expect(result).toEqual({ identifier: "assemkh" });
  });
});
