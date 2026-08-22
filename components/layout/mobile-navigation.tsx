import { CalendarRange, House, Menu, Plus, ReceiptText } from "lucide-react";
import Link from "next/link";

import type { Messages } from "@/lib/i18n/types";

type MobileNavigationProps = {
  messages: Messages;
};

export function MobileNavigation({ messages }: MobileNavigationProps) {
  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 items-end rounded-[1.35rem] border border-white/10 bg-[hsl(var(--sidebar))]/95 px-2 py-2 text-[hsl(var(--sidebar-muted))] shadow-2xl backdrop-blur-xl lg:hidden"
      aria-label={messages.shell.mobileNavigation}
    >
      <Link
        href="/dashboard"
        className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[0.65rem] font-medium text-white"
        aria-current="page"
      >
        <House aria-hidden="true" className="size-[1.1rem]" />
        {messages.navigation.dashboard}
      </Link>
      <DisabledMobileItem icon={ReceiptText} label={messages.navigation.expenses} />
      <button
        type="button"
        disabled
        className="-mt-5 flex min-h-14 cursor-not-allowed flex-col items-center justify-center gap-1 text-[0.65rem] font-medium"
        aria-label={`${messages.navigation.add} · ${messages.navigation.comingSoon}`}
      >
        <span className="grid size-12 place-items-center rounded-full border-4 border-[hsl(var(--sidebar))] bg-accent text-accent-foreground shadow-lg">
          <Plus aria-hidden="true" className="size-5" />
        </span>
        {messages.navigation.add}
      </button>
      <DisabledMobileItem
        icon={CalendarRange}
        label={messages.navigation.monthlyPlan}
      />
      <DisabledMobileItem icon={Menu} label={messages.navigation.more} />
    </nav>
  );
}

function DisabledMobileItem({
  icon: Icon,
  label,
}: {
  icon: typeof House;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled
      className="flex min-h-12 cursor-not-allowed flex-col items-center justify-center gap-1 rounded-xl text-[0.65rem] font-medium opacity-70"
    >
      <Icon aria-hidden="true" className="size-[1.1rem]" />
      <span className="max-w-16 truncate">{label}</span>
    </button>
  );
}
