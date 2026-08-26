"use client";

import { Menu, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavigationSheet } from "@/components/layout/navigation-sheet";
import { activeDestination, phoneBarDestinations } from "@/lib/navigation/catalog";
import type { Messages } from "@/lib/i18n/types";

/**
 * The phone bar keeps the household's frequent actions one tap away. Everything else
 * lives behind More, which opens the full catalog — replacing the Accounts item that
 * used to style itself active for eleven unrelated routes while declaring
 * `aria-current` on only one of them.
 */
export function MobileNavigation({ messages }: { messages: Messages }) {
  const pathname = usePathname();
  const active = activeDestination(pathname);
  const destinations = phoneBarDestinations();

  return (
    <nav
      id="phone-navigation"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 grid grid-cols-5 items-end rounded-[1.35rem] border border-white/10 bg-[hsl(var(--sidebar))]/95 px-2 py-2 text-[hsl(var(--sidebar-muted))] shadow-2xl backdrop-blur-xl md:hidden"
      aria-label={messages.shell.mobileNavigation}
    >
      {destinations.slice(0, 2).map((destination) => (
        <PhoneBarLink
          key={destination.id}
          destination={destination}
          isActive={active?.id === destination.id}
          messages={messages}
        />
      ))}

      <Link
        href="/expenses#expense-entry"
        className="-mt-5 flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 text-xs font-medium text-white transition hover:-translate-y-0.5"
        aria-label={`${messages.navigation.add} ${messages.navigation.expenses}`}
      >
        <span className="grid size-12 place-items-center rounded-full border-4 border-[hsl(var(--sidebar))] bg-accent text-accent-foreground shadow-lg">
          <Plus aria-hidden="true" className="size-5" />
        </span>
        {messages.navigation.add}
      </Link>

      {destinations.slice(2).map((destination) => (
        <PhoneBarLink
          key={destination.id}
          destination={destination}
          isActive={active?.id === destination.id}
          messages={messages}
        />
      ))}

      <NavigationSheet
        messages={messages}
        trigger={({ open, expanded }) => (
          <button
            type="button"
            onClick={open}
            aria-expanded={expanded}
            aria-haspopup="dialog"
            className="flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-medium transition hover:text-white"
          >
            <Menu aria-hidden="true" className="size-[1.1rem]" />
            <span className="text-balance leading-tight">
              {messages.navigation.more}
            </span>
          </button>
        )}
      />
    </nav>
  );
}

function PhoneBarLink({
  destination,
  isActive,
  messages,
}: {
  destination: ReturnType<typeof phoneBarDestinations>[number];
  isActive: boolean;
  messages: Messages;
}) {
  const Icon = destination.icon;

  return (
    <Link
      href={destination.href}
      aria-current={isActive ? "page" : undefined}
      className={`flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-medium transition ${
        isActive ? "text-white" : "hover:text-white"
      }`}
    >
      <Icon aria-hidden="true" className="size-[1.1rem]" />
      <span className="text-balance leading-tight">{destination.label(messages)}</span>
    </Link>
  );
}
