import Link from "next/link";
import { ChevronDown, LogOut, ShieldCheck, UserRound } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import type { CurrentProfile } from "@/lib/auth/profile";
import { formatFullDate, formatMonth } from "@/lib/formatting/date";
import type { Messages } from "@/lib/i18n/types";

type AppHeaderProps = {
  messages: Messages;
  profile: CurrentProfile;
};

export function AppHeader({ messages, profile }: AppHeaderProps) {
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
            <span className="size-2 rounded-full bg-[hsl(var(--success))]" />
            {messages.shell.signedIn}
          </div>
          <div className="hidden rounded-full border bg-card p-1 shadow-sm sm:block">
            <ThemeSwitcher
              darkLabel={messages.shell.themeDark}
              label={messages.shell.theme}
              lightLabel={messages.shell.themeLight}
              systemLabel={messages.shell.themeSystem}
            />
          </div>
          <details className="group relative">
            <summary
              className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-full bg-primary ps-3 pe-2 text-sm font-semibold text-primary-foreground shadow-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
              aria-label={messages.shell.privateWorkspace}
            >
              <span className="grid size-6 place-items-center rounded-full bg-white/12">
                <UserRound aria-hidden="true" className="size-3.5" />
              </span>
              <span className="hidden max-w-24 truncate sm:block">
                {profile.displayName}
              </span>
              <ChevronDown
                aria-hidden="true"
                className="size-3.5 transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="absolute end-0 top-12 z-50 w-64 rounded-2xl border bg-popover p-2 text-popover-foreground shadow-xl">
              <div className="rounded-xl bg-muted/65 px-3 py-2.5">
                <p className="truncate text-sm font-semibold">{profile.displayName}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  @{profile.username} · {profile.role}
                </p>
              </div>
              <Link
                href="/change-password"
                className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
              >
                <ShieldCheck aria-hidden="true" className="size-4" />
                Change password
              </Link>
              <form action={logoutAction}>
                <input type="hidden" name="scope" value="local" />
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  Sign out this device
                </button>
              </form>
              <form action={logoutAction}>
                <input type="hidden" name="scope" value="global" />
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  Sign out everywhere
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
