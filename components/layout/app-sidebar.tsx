"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/brand/brand-mark";
import {
  activeDestination,
  destinationsInGroup,
  navigationGroupLabels,
  type NavigationGroup,
} from "@/lib/navigation/catalog";
import type { Messages } from "@/lib/i18n/types";

const groups: readonly NavigationGroup[] = ["overview", "workspace"];

/**
 * The full 17.5rem sidebar, now shown from `shell` (1200px) rather than `lg` (1024px)
 * so a landscape tablet keeps its content width. Below that the tablet rail takes over.
 */
export function AppSidebar({ messages }: { messages: Messages }) {
  const pathname = usePathname();
  const active = activeDestination(pathname);

  return (
    <aside className="fixed inset-y-0 start-0 z-40 hidden w-[17.5rem] flex-col border-e border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] px-4 py-5 shell:flex">
      <div className="px-2">
        <BrandMark messages={messages} />
      </div>

      <nav
        className="mt-9 flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto pb-4"
        aria-label={messages.shell.primaryNavigation}
      >
        {groups.map((group) => (
          <div key={group}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sidebar-muted))]">
              {navigationGroupLabels[group](messages)}
            </p>
            <ul className="space-y-1">
              {destinationsInGroup(group).map((destination) => {
                const isActive = active?.id === destination.id;
                const Icon = destination.icon;

                return (
                  <li key={destination.id}>
                    <Link
                      href={destination.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-white/[0.07] hover:text-white ${
                        isActive
                          ? "bg-white/[0.09] text-white shadow-sm"
                          : "text-[hsl(var(--sidebar-muted))]"
                      }`}
                    >
                      <Icon aria-hidden="true" className="size-[1.1rem] shrink-0" />
                      <span className="min-w-0 break-words">
                        {destination.label(messages)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
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
