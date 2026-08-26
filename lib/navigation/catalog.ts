import {
  ArrowLeftRight,
  BarChart3,
  CalendarRange,
  CircleDollarSign,
  Gem,
  Goal,
  HandCoins,
  House,
  Landmark,
  LineChart,
  ReceiptText,
  Repeat2,
  Settings2,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import type { Messages } from "@/lib/i18n/types";

/**
 * The single source of truth for every navigation surface: the desktop sidebar, the
 * tablet rail, the phone bar, and the navigation sheet all render from this list.
 *
 * Adding a route means adding an entry here, not editing four components. The active
 * rule lives beside the destination so the visual state and `aria-current` cannot
 * drift apart the way they did when each surface carried its own pathname literals.
 *
 * See docs/adr/0003-adaptive-navigation-and-breakpoints.md.
 */
export type NavigationGroup = "overview" | "workspace";

export type NavigationDestination = {
  /** Stable key for React lists and tests; never shown to a person. */
  readonly id: string;
  readonly href: string;
  readonly icon: LucideIcon;
  readonly group: NavigationGroup;
  /** Resolves the localized label for this destination. */
  readonly label: (messages: Messages) => string;
  /**
   * `exact` matches only this path. `segment` also matches nested paths below it,
   * which is what a future detail route needs.
   */
  readonly match: "exact" | "segment";
};

export const navigationDestinations: readonly NavigationDestination[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    icon: House,
    group: "overview",
    label: (messages) => messages.navigation.dashboard,
    match: "segment",
  },
  {
    id: "monthly-plan",
    href: "/monthly-plan",
    icon: CalendarRange,
    group: "overview",
    label: (messages) => messages.navigation.monthlyPlan,
    match: "segment",
  },
  {
    id: "expenses",
    href: "/expenses",
    icon: ReceiptText,
    group: "overview",
    label: (messages) => messages.navigation.expenses,
    match: "segment",
  },
  {
    id: "income",
    href: "/income",
    icon: CircleDollarSign,
    group: "overview",
    label: (messages) => messages.navigation.income,
    match: "segment",
  },
  {
    id: "accounts",
    href: "/accounts",
    icon: WalletCards,
    group: "overview",
    label: (messages) => messages.navigation.accounts,
    match: "segment",
  },
  {
    id: "goals",
    href: "/goals",
    icon: Goal,
    group: "overview",
    label: (messages) => messages.navigation.goals,
    match: "segment",
  },
  {
    id: "assets",
    href: "/assets",
    icon: Gem,
    group: "workspace",
    label: (messages) => messages.navigation.assets,
    match: "segment",
  },
  {
    id: "investments",
    href: "/investments",
    icon: LineChart,
    group: "workspace",
    label: (messages) => messages.navigation.investments,
    match: "segment",
  },
  {
    id: "liabilities",
    href: "/liabilities",
    icon: HandCoins,
    group: "workspace",
    label: (messages) => messages.navigation.liabilities,
    match: "segment",
  },
  {
    id: "transfers",
    href: "/transfers",
    icon: ArrowLeftRight,
    group: "workspace",
    label: (messages) => messages.navigation.transfers,
    match: "segment",
  },
  {
    id: "recurring",
    href: "/recurring",
    icon: Repeat2,
    group: "workspace",
    label: (messages) => messages.navigation.recurring,
    match: "segment",
  },
  {
    id: "net-worth",
    href: "/net-worth",
    icon: Landmark,
    group: "workspace",
    label: (messages) => messages.navigation.netWorth,
    match: "segment",
  },
  {
    id: "reports",
    href: "/reports",
    icon: BarChart3,
    group: "workspace",
    label: (messages) => messages.navigation.reports,
    match: "segment",
  },
  {
    id: "settings",
    href: "/settings",
    icon: Settings2,
    group: "workspace",
    label: (messages) => messages.navigation.settings,
    match: "segment",
  },
] as const;

/**
 * The destinations the phone bar shows directly. Everything else is one tap away in
 * the navigation sheet, which is the whole catalog.
 */
export const phoneBarDestinationIds = ["dashboard", "expenses", "income"] as const;

export const navigationGroupLabels: Record<
  NavigationGroup,
  (messages: Messages) => string
> = {
  overview: (messages) => messages.shell.overview,
  workspace: (messages) => messages.shell.privateWorkspace,
};

export function destinationsInGroup(group: NavigationGroup) {
  return navigationDestinations.filter((destination) => destination.group === group);
}

export function phoneBarDestinations() {
  return phoneBarDestinationIds.map((id) => {
    const destination = navigationDestinations.find((entry) => entry.id === id);
    if (!destination) {
      throw new Error(`Phone navigation references unknown destination: ${id}`);
    }
    return destination;
  });
}

/**
 * The one predicate behind both the active styling and `aria-current`. A destination
 * matches its own path, and a `segment` destination also matches paths nested under
 * it — but never a sibling that merely shares a prefix, so `/net-worth` cannot light
 * up for `/net-worth-archive`.
 */
export function isDestinationActive(
  pathname: string,
  destination: NavigationDestination,
) {
  if (pathname === destination.href) return true;
  if (destination.match === "exact") return false;
  return pathname.startsWith(`${destination.href}/`);
}

/** The single destination to mark active, or null when the route is outside the catalog. */
export function activeDestination(pathname: string) {
  const matches = navigationDestinations.filter((destination) =>
    isDestinationActive(pathname, destination),
  );
  if (matches.length === 0) return null;

  // Longest href wins, so a nested destination beats the parent it sits under.
  return matches.reduce((best, candidate) =>
    candidate.href.length > best.href.length ? candidate : best,
  );
}
