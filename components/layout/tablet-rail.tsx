"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { NavigationSheet } from "@/components/layout/navigation-sheet";
import { activeDestination, navigationDestinations } from "@/lib/navigation/catalog";
import type { Messages } from "@/lib/i18n/types";

/**
 * The 768px–1199px mode. Every destination is on the rail directly, so nothing is
 * hidden, and the sheet supplies the full labels the icons compress. This range used
 * to get the phone bar, which exposed five of fourteen destinations.
 */
export function TabletRail({ messages }: { messages: Messages }) {
  const pathname = usePathname();
  const active = activeDestination(pathname);

  return (
    <aside
      className="fixed inset-y-0 start-0 z-40 hidden w-[4.5rem] flex-col items-center border-e border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] py-3 md:flex shell:hidden"
      aria-label={messages.shell.compactNavigation}
    >
      <NavigationSheet
        messages={messages}
        trigger={({ open, expanded }) => (
          <button
            type="button"
            onClick={open}
            aria-expanded={expanded}
            aria-haspopup="dialog"
            aria-label={messages.shell.openNavigation}
            title={messages.shell.openNavigation}
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl text-[hsl(var(--sidebar-muted))] transition hover:bg-white/[0.07] hover:text-white"
          >
            <Menu aria-hidden="true" className="size-[1.15rem]" />
          </button>
        )}
      />

      <nav
        aria-label={messages.shell.primaryNavigation}
        className="mt-2 flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        <ul className="flex flex-col items-center gap-0.5 pb-2">
          {navigationDestinations.map((destination, index) => {
            const isActive = active?.id === destination.id;
            const Icon = destination.icon;
            const startsWorkspace =
              index > 0 &&
              destination.group === "workspace" &&
              navigationDestinations[index - 1].group === "overview";

            return (
              <Fragment key={destination.id}>
                {startsWorkspace ? (
                  <li
                    aria-hidden="true"
                    className="my-1.5 h-px w-8 shrink-0 bg-white/10"
                  />
                ) : null}
                <li>
                  <Link
                    href={destination.href}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={destination.label(messages)}
                    title={destination.label(messages)}
                    className={`grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl transition ${
                      isActive
                        ? "bg-white/[0.12] text-white shadow-sm"
                        : "text-[hsl(var(--sidebar-muted))] hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    <Icon aria-hidden="true" className="size-[1.15rem]" />
                  </Link>
                </li>
              </Fragment>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
