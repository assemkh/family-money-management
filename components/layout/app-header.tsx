import { CalendarDays, LockKeyhole } from "lucide-react";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { formatFullDate, formatMonth } from "@/lib/formatting/date";
import type { Messages } from "@/lib/i18n/types";

type AppHeaderProps = {
  authenticated: boolean;
  messages: Messages;
};

export function AppHeader({ authenticated, messages }: AppHeaderProps) {
  const now = new Date();

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="flex min-h-[4.75rem] items-center justify-between gap-4 px-4 sm:px-6 xl:px-10">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {messages.shell.familyName}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="truncate font-display text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
              {formatMonth(now)}
            </h2>
            <span className="hidden text-xs text-muted-foreground md:inline">
              · {formatFullDate(now)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm sm:flex">
            {authenticated ? (
              <span className="size-2 rounded-full bg-[hsl(var(--success))]" />
            ) : (
              <LockKeyhole aria-hidden="true" className="size-3.5" />
            )}
            {authenticated ? messages.shell.signedIn : messages.shell.setupMode}
          </div>
          <div className="hidden rounded-full border bg-card p-1 shadow-sm sm:block">
            <ThemeSwitcher
              darkLabel={messages.shell.themeDark}
              label={messages.shell.theme}
              lightLabel={messages.shell.themeLight}
              systemLabel={messages.shell.themeSystem}
            />
          </div>
          <div
            className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm"
            aria-label={messages.shell.privateWorkspace}
          >
            <CalendarDays aria-hidden="true" className="size-[1.1rem]" />
          </div>
        </div>
      </div>
    </header>
  );
}
