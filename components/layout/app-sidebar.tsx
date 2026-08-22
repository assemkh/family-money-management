"use client";

import {
  ArrowLeftRight,
  BarChart3,
  CalendarRange,
  CircleDollarSign,
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
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/brand/brand-mark";
import type { Messages } from "@/lib/i18n/types";

type NavigationItem = {
  icon: LucideIcon;
  label: string;
  href?: string;
};

type AppSidebarProps = {
  messages: Messages;
};

export function AppSidebar({ messages }: AppSidebarProps) {
  const primaryItems: NavigationItem[] = [
    {
      href: "/dashboard",
      icon: House,
      label: messages.navigation.dashboard,
    },
    { icon: CalendarRange, label: messages.navigation.monthlyPlan },
    {
      href: "/expenses",
      icon: ReceiptText,
      label: messages.navigation.expenses,
    },
    {
      href: "/income",
      icon: CircleDollarSign,
      label: messages.navigation.income,
    },
    { icon: WalletCards, label: messages.navigation.accounts },
    { icon: Goal, label: messages.navigation.goals },
  ];

  const planningItems: NavigationItem[] = [
    { icon: LineChart, label: messages.navigation.investments },
    { icon: HandCoins, label: messages.navigation.liabilities },
    { icon: ArrowLeftRight, label: messages.navigation.transfers },
    { icon: Repeat2, label: messages.navigation.recurring },
    { icon: Landmark, label: messages.navigation.netWorth },
    { icon: BarChart3, label: messages.navigation.reports },
    { icon: Settings2, label: messages.navigation.settings },
  ];

  return (
    <aside className="fixed inset-y-0 start-0 z-40 hidden w-[17.5rem] flex-col border-e border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] px-4 py-5 lg:flex">
      <div className="px-2">
        <BrandMark messages={messages} />
      </div>

      <nav
        className="mt-9 flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto pb-4"
        aria-label={messages.shell.primaryNavigation}
      >
        <NavigationGroup
          comingSoon={messages.navigation.comingSoon}
          items={primaryItems}
          label={messages.shell.overview}
        />
        <NavigationGroup
          comingSoon={messages.navigation.comingSoon}
          items={planningItems}
          label={messages.shell.privateWorkspace}
        />
      </nav>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-3.5">
        <div className="flex items-center gap-2 text-xs font-medium text-[hsl(var(--sidebar-foreground))]">
          <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.1)]" />
          {messages.shell.privateWorkspace}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[hsl(var(--sidebar-muted))]">
          {messages.dashboard.emptyDescription}
        </p>
      </div>
    </aside>
  );
}

function NavigationGroup({
  comingSoon,
  items,
  label,
}: {
  comingSoon: string;
  items: NavigationItem[];
  label: string;
}) {
  const pathname = usePathname();

  return (
    <div>
      <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sidebar-muted))]">
        {label}
      </p>
      <ul className="space-y-1">
        {items.map(({ href, icon: Icon, label: itemLabel }) => (
          <li key={itemLabel}>
            {href ? (
              <Link
                href={href}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-white/[0.07] hover:text-white ${
                  pathname === href
                    ? "bg-white/[0.09] text-white shadow-sm"
                    : "text-[hsl(var(--sidebar-muted))]"
                }`}
                aria-current={pathname === href ? "page" : undefined}
              >
                <Icon aria-hidden="true" className="size-[1.1rem]" />
                {itemLabel}
              </Link>
            ) : (
              <span
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--sidebar-muted))]"
                aria-disabled="true"
                title={comingSoon}
              >
                <Icon aria-hidden="true" className="size-[1.1rem]" />
                <span className="flex-1">{itemLabel}</span>
                <span className="size-1 rounded-full bg-white/15" />
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
