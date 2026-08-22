import Link from "next/link";

import type { Messages } from "@/lib/i18n/types";

type BrandMarkProps = {
  compact?: boolean;
  messages: Messages;
};

export function BrandMark({ compact = false, messages }: BrandMarkProps) {
  return (
    <Link
      href="/dashboard"
      className="group inline-flex items-center gap-3 rounded-xl"
      aria-label={messages.brand.name}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-[0.9rem] border border-white/10 bg-white/[0.08] font-display text-lg font-semibold tracking-[-0.04em] text-[hsl(var(--sidebar-foreground))] transition-colors group-hover:bg-white/[0.12]">
        {messages.brand.monogram}
      </span>
      {compact ? null : (
        <span className="min-w-0">
          <span className="block truncate font-display text-[1.08rem] font-semibold leading-tight text-[hsl(var(--sidebar-foreground))]">
            {messages.brand.name}
          </span>
          <span className="mt-0.5 block truncate text-[0.68rem] font-medium uppercase tracking-[0.16em] text-[hsl(var(--sidebar-muted))]">
            {messages.brand.subtitle}
          </span>
        </span>
      )}
    </Link>
  );
}
