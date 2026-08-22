"use client";

import { CircleDollarSign, House, Plus, ReceiptText, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Messages } from "@/lib/i18n/types";

type MobileNavigationProps = {
  messages: Messages;
};

export function MobileNavigation({ messages }: MobileNavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 items-end rounded-[1.35rem] border border-white/10 bg-[hsl(var(--sidebar))]/95 px-2 py-2 text-[hsl(var(--sidebar-muted))] shadow-2xl backdrop-blur-xl lg:hidden"
      aria-label={messages.shell.mobileNavigation}
    >
      <Link
        href="/dashboard"
        className={`flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-[0.65rem] font-medium transition ${
          pathname === "/dashboard" ? "text-white" : "hover:text-white"
        }`}
        aria-current={pathname === "/dashboard" ? "page" : undefined}
      >
        <House aria-hidden="true" className="size-[1.1rem]" />
        {messages.navigation.dashboard}
      </Link>
      <Link
        href="/expenses"
        className={`flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-[0.65rem] font-medium transition ${
          pathname === "/expenses" ? "text-white" : "hover:text-white"
        }`}
        aria-current={pathname === "/expenses" ? "page" : undefined}
      >
        <ReceiptText aria-hidden="true" className="size-[1.1rem]" />
        <span className="max-w-16 truncate">{messages.navigation.expenses}</span>
      </Link>
      <Link
        href="/expenses#expense-entry"
        className="-mt-5 flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 text-[0.65rem] font-medium text-white transition hover:-translate-y-0.5"
        aria-label={`${messages.navigation.add} ${messages.navigation.expenses}`}
      >
        <span className="grid size-12 place-items-center rounded-full border-4 border-[hsl(var(--sidebar))] bg-accent text-accent-foreground shadow-lg">
          <Plus aria-hidden="true" className="size-5" />
        </span>
        {messages.navigation.add}
      </Link>
      <Link
        href="/income"
        className={`flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-[0.65rem] font-medium transition ${
          pathname === "/income" ? "text-white" : "hover:text-white"
        }`}
        aria-current={pathname === "/income" ? "page" : undefined}
      >
        <CircleDollarSign aria-hidden="true" className="size-[1.1rem]" />
        <span className="max-w-16 truncate">{messages.navigation.income}</span>
      </Link>
      <Link
        href="/accounts"
        className={`flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-[0.65rem] font-medium transition ${
          [
            "/accounts",
            "/transfers",
            "/assets",
            "/investments",
            "/liabilities",
            "/recurring",
          ].includes(pathname)
            ? "text-white"
            : "hover:text-white"
        }`}
        aria-current={pathname === "/accounts" ? "page" : undefined}
      >
        <WalletCards aria-hidden="true" className="size-[1.1rem]" />
        <span className="max-w-16 truncate">{messages.navigation.accounts}</span>
      </Link>
    </nav>
  );
}
