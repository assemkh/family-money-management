import { describe, expect, it } from "vitest";

import { getAuthRedirect, isPublicRoute } from "@/lib/auth/access";

describe("route access", () => {
  it("fails closed for an unauthenticated dashboard request", () => {
    expect(getAuthRedirect("/dashboard", false)).toBe("/login");
  });

  it("allows unauthenticated access only to explicit public routes", () => {
    expect(isPublicRoute("/")).toBe(true);
    expect(isPublicRoute("/login")).toBe(true);
    expect(isPublicRoute("/api/health")).toBe(true);
    expect(isPublicRoute("/auth/callback")).toBe(true);
    expect(isPublicRoute("/dashboard")).toBe(false);
  });

  it("keeps an unauthenticated login request on the login page", () => {
    expect(getAuthRedirect("/login", false)).toBeNull();
  });

  it("moves an authenticated user away from the login page", () => {
    expect(getAuthRedirect("/login", true)).toBe("/dashboard");
  });

  it("allows an authenticated dashboard request", () => {
    expect(getAuthRedirect("/dashboard", true)).toBeNull();
  });
});
