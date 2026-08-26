"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import {
  activeDestination,
  destinationsInGroup,
  navigationGroupLabels,
  type NavigationGroup,
} from "@/lib/navigation/catalog";
import type { Messages } from "@/lib/i18n/types";

const groups: readonly NavigationGroup[] = ["overview", "workspace"];

type NavigationSheetProps = {
  messages: Messages;
  /** Renders the control that opens the sheet; `open` is wired by this component. */
  trigger: (props: { open: () => void; expanded: boolean }) => ReactNode;
};

/**
 * The complete destination list, shared by the phone bar's More button and the tablet
 * rail. A native `<dialog>` provides the focus trap, Escape handling, and focus
 * restoration; the extras here are backdrop dismissal and closing on navigation so the
 * browser Back button can never reveal a stale overlay.
 */
export function NavigationSheet({ messages, trigger }: NavigationSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const titleId = useId();
  const active = activeDestination(pathname);

  // The sheet remembers which route it was opened on. Deriving `expanded` from that
  // means any navigation — a link inside the sheet, or the browser Back button —
  // closes it without an effect that writes state.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const expanded = openedOn === pathname;
  const close = () => setOpenedOn(null);

  // Sync the real dialog to that derived state. `showModal()` gives the focus trap,
  // Escape handling, and focus restoration; only this effect touches the ref.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (expanded && !dialog.open) dialog.showModal();
    if (!expanded && dialog.open) dialog.close();
  }, [expanded]);

  return (
    <>
      {trigger({ open: () => setOpenedOn(pathname), expanded })}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={close}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="m-0 mt-auto max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-[1.5rem] border-t bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm sm:m-auto sm:max-h-[calc(100dvh-3rem)] sm:w-[min(34rem,calc(100%-2rem))] sm:rounded-[1.5rem] sm:border"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-card/95 px-5 py-4 backdrop-blur">
          <h2 id={titleId} className="font-display text-xl font-semibold">
            {messages.shell.allDestinations}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label={messages.shell.closeNavigation}
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border transition hover:bg-muted"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <nav
          aria-label={messages.shell.allDestinations}
          className="px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4"
        >
          {groups.map((group) => (
            <div key={group} className="mb-5 last:mb-0">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {navigationGroupLabels[group](messages)}
              </p>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {destinationsInGroup(group).map((destination) => {
                  const isActive = active?.id === destination.id;
                  const Icon = destination.icon;

                  return (
                    <li key={destination.id}>
                      <Link
                        href={destination.href}
                        aria-current={isActive ? "page" : undefined}
                        onClick={close}
                        className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        }`}
                      >
                        <Icon aria-hidden="true" className="size-[1.15rem] shrink-0" />
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
      </dialog>
    </>
  );
}
