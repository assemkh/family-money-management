import { describe, expect, it } from "vitest";

import { getAuthRedirect, isPublicRoute } from "@/lib/auth/access";
import { sessionCookieOptions } from "@/lib/auth/cookies";

describe("route access", () => {
  it("fails closed for an unauthenticated dashboard request", () => {
    expect(getAuthRedirect("/dashboard", false)).toBe("/login");
  });

  it("allows unauthenticated access only to explicit public routes", () => {
    expect(isPublicRoute("/")).toBe(true);
    expect(isPublicRoute("/login")).toBe(true);
    expect(isPublicRoute("/forgot-password")).toBe(true);
    expect(isPublicRoute("/api/health")).toBe(true);
    expect(isPublicRoute("/auth/callback")).toBe(true);
    expect(isPublicRoute("/opengraph-image")).toBe(true);
    expect(isPublicRoute("/robots.txt")).toBe(true);
    expect(isPublicRoute("/change-password")).toBe(false);
    expect(isPublicRoute("/dashboard")).toBe(false);
  });

  it("keeps an unauthenticated login request on the login page", () => {
    expect(getAuthRedirect("/login", false)).toBeNull();
  });

  it("lets the login page resolve active versus disabled authenticated users", () => {
    expect(getAuthRedirect("/login", true)).toBeNull();
  });

  it("allows an authenticated dashboard request", () => {
    expect(getAuthRedirect("/dashboard", true)).toBeNull();
  });
});

describe("session persistence", () => {
  it("keeps expiry metadata when remember-session is enabled", () => {
    const expires = new Date("2030-01-01T00:00:00.000Z");

    expect(sessionCookieOptions({ expires, maxAge: 3600, path: "/" }, true)).toEqual({
      expires,
      maxAge: 3600,
      path: "/",
    });
  });

  it("uses browser-session cookies when remember-session is disabled", () => {
    expect(
      sessionCookieOptions(
        { expires: new Date("2030-01-01T00:00:00.000Z"), maxAge: 3600, path: "/" },
        false,
      ),
    ).toEqual({ path: "/" });
  });
});
