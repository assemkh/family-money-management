import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthState } from "@/lib/auth/session";

type VerifiedClaims = Extract<AuthState, { status: "authenticated" }>["claims"];

vi.mock("server-only", () => ({}));

// `cache()` is request-scoped memoization. Replacing it with identity keeps each
// scenario independent instead of leaking one resolution into the next.
vi.mock("react", async () => {
  const react = await vi.importActual<typeof import("react")>("react");
  return { ...react, cache: <T>(fn: T) => fn };
});

const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirect(path) }));

const readAuthState = vi.fn<() => Promise<AuthState>>();
vi.mock("@/lib/auth/session", () => ({ readAuthState: () => readAuthState() }));

const maybeSingle = vi.fn();
const getRequestClient = vi.fn(async () => ({
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
}));
vi.mock("@/lib/supabase/server", () => ({
  getRequestClient: () => getRequestClient(),
}));

const { readHouseholdContext, requireHouseholdContext } =
  await import("@/lib/auth/household-context");

const ownerRow = {
  id: "user-1",
  family_id: "household-1",
  display_name: "Amina",
  username: "amina",
  role: "owner" as const,
  must_change_password: false,
  families: { locale: "en" },
};

function authenticated(sub = "user-1"): AuthState {
  return { status: "authenticated", claims: { sub } as VerifiedClaims };
}

beforeEach(() => {
  vi.clearAllMocks();
  readAuthState.mockResolvedValue(authenticated());
  maybeSingle.mockResolvedValue({ data: ownerRow, error: null });
});

describe("readHouseholdContext", () => {
  it("resolves one context for an owner", async () => {
    const context = await readHouseholdContext();

    expect(context).not.toBeNull();
    expect(context?.userId).toBe("user-1");
    expect(context?.householdId).toBe("household-1");
    expect(context?.member.role).toBe("owner");
    expect(context?.member.displayName).toBe("Amina");
    expect(context?.locale).toBe("en");
    expect(context?.direction).toBe("ltr");
  });

  it("resolves a member without owner authority", async () => {
    maybeSingle.mockResolvedValue({
      data: { ...ownerRow, role: "member" },
      error: null,
    });

    const context = await readHouseholdContext();

    expect(context?.member.role).toBe("member");
  });

  it("reads the Household exactly once per resolution", async () => {
    await readHouseholdContext();

    expect(maybeSingle).toHaveBeenCalledTimes(1);
    expect(getRequestClient).toHaveBeenCalledTimes(1);
  });

  it("returns null for an anonymous caller", async () => {
    readAuthState.mockResolvedValue({ status: "anonymous" });

    expect(await readHouseholdContext()).toBeNull();
    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it("returns null when Supabase is unconfigured or unavailable", async () => {
    readAuthState.mockResolvedValue({ status: "unconfigured" });
    expect(await readHouseholdContext()).toBeNull();

    readAuthState.mockResolvedValue({ status: "unavailable" });
    expect(await readHouseholdContext()).toBeNull();
  });

  it("returns null when a verified session has no readable profile", async () => {
    // An inactive Member is banned in Auth and blocked by RLS, so the profile read
    // yields nothing even though claims verified.
    maybeSingle.mockResolvedValue({ data: null, error: null });

    expect(await readHouseholdContext()).toBeNull();
  });

  it("returns null when the profile read fails", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: "denied" } });

    expect(await readHouseholdContext()).toBeNull();
  });

  it("returns null when the verified claims carry no subject", async () => {
    readAuthState.mockResolvedValue({
      status: "authenticated",
      claims: {} as VerifiedClaims,
    });

    expect(await readHouseholdContext()).toBeNull();
  });

  it("surfaces the must-change-password flag without deciding for the caller", async () => {
    maybeSingle.mockResolvedValue({
      data: { ...ownerRow, must_change_password: true },
      error: null,
    });

    const context = await readHouseholdContext();

    expect(context?.member.mustChangePassword).toBe(true);
  });
});

describe("household locale", () => {
  it("uses the embedded Household locale and its direction", async () => {
    maybeSingle.mockResolvedValue({
      data: { ...ownerRow, families: { locale: "ar" } },
      error: null,
    });

    const context = await readHouseholdContext();

    expect(context?.locale).toBe("ar");
    expect(context?.direction).toBe("rtl");
    expect(context?.messages.shell.skipToContent).toBeTruthy();
  });

  it("accepts the embedded Household as an array", async () => {
    maybeSingle.mockResolvedValue({
      data: { ...ownerRow, families: [{ locale: "ar" }] },
      error: null,
    });

    expect((await readHouseholdContext())?.locale).toBe("ar");
  });

  it("falls back to the default locale for a missing or unsupported value", async () => {
    for (const families of [null, {}, { locale: "fr" }, { locale: 7 }]) {
      maybeSingle.mockResolvedValue({ data: { ...ownerRow, families }, error: null });

      expect((await readHouseholdContext())?.locale).toBe("en");
    }
  });
});

describe("requireHouseholdContext", () => {
  it("returns the context for a signed-in Member", async () => {
    await expect(requireHouseholdContext()).resolves.toMatchObject({
      householdId: "household-1",
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects an unresolvable caller to login", async () => {
    readAuthState.mockResolvedValue({ status: "anonymous" });

    await expect(requireHouseholdContext()).rejects.toThrow("REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects a Member who must replace their password", async () => {
    maybeSingle.mockResolvedValue({
      data: { ...ownerRow, must_change_password: true },
      error: null,
    });

    await expect(requireHouseholdContext()).rejects.toThrow(
      "REDIRECT:/change-password",
    );
    expect(redirect).toHaveBeenCalledWith("/change-password");
  });
});
