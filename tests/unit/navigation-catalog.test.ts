import { describe, expect, it } from "vitest";

import { messages as arMessages } from "@/lib/i18n/messages/ar";
import { messages as enMessages } from "@/lib/i18n/messages/en";
import {
  activeDestination,
  destinationsInGroup,
  isDestinationActive,
  navigationDestinations,
  phoneBarDestinations,
} from "@/lib/navigation/catalog";

const applicationRoutes = [
  "/dashboard",
  "/monthly-plan",
  "/expenses",
  "/income",
  "/accounts",
  "/goals",
  "/assets",
  "/investments",
  "/liabilities",
  "/transfers",
  "/recurring",
  "/net-worth",
  "/reports",
  "/settings",
] as const;

describe("route catalog", () => {
  it("covers every authenticated destination exactly once", () => {
    const hrefs = navigationDestinations.map((destination) => destination.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect([...hrefs].sort()).toEqual([...applicationRoutes].sort());
  });

  it("gives every destination a unique id", () => {
    const ids = navigationDestinations.map((destination) => destination.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("places every destination in exactly one rendered group", () => {
    const grouped = [
      ...destinationsInGroup("overview"),
      ...destinationsInGroup("workspace"),
    ];

    expect(grouped).toHaveLength(navigationDestinations.length);
  });

  it("labels every destination in both locales", () => {
    for (const destination of navigationDestinations) {
      expect(destination.label(enMessages).trim().length).toBeGreaterThan(0);
      expect(destination.label(arMessages).trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps the phone bar a strict subset of the catalog", () => {
    const bar = phoneBarDestinations();

    expect(bar.length).toBeLessThan(navigationDestinations.length);
    for (const destination of bar) {
      expect(navigationDestinations).toContain(destination);
    }
  });
});

describe("active destination", () => {
  it("marks exactly one destination active on each application route", () => {
    for (const route of applicationRoutes) {
      const matches = navigationDestinations.filter((destination) =>
        isDestinationActive(route, destination),
      );

      expect(matches, `expected one active destination for ${route}`).toHaveLength(1);
      expect(activeDestination(route)?.href).toBe(route);
    }
  });

  it("keeps a nested route active on its parent destination", () => {
    expect(activeDestination("/expenses/2026-08")?.id).toBe("expenses");
    expect(activeDestination("/reports/export")?.id).toBe("reports");
  });

  it("does not activate a sibling that merely shares a prefix", () => {
    // The old bar styled Accounts active for eleven unrelated routes. A prefix test
    // without the segment boundary would reintroduce that class of bug.
    expect(activeDestination("/net-worth-archive")).toBeNull();
    expect(activeDestination("/settings-export")).toBeNull();
  });

  it("returns null outside the catalog rather than guessing", () => {
    expect(activeDestination("/login")).toBeNull();
    expect(activeDestination("/change-password")).toBeNull();
    expect(activeDestination("/")).toBeNull();
  });

  it("prefers the most specific destination when two could match", () => {
    const deepest = activeDestination("/net-worth");

    expect(deepest?.id).toBe("net-worth");
  });
});
