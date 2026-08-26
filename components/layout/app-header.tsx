import Link from "next/link";
import { ChevronDown, LogOut, Settings2, ShieldCheck, UserRound } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { HouseholdMember } from "@/lib/auth/household-context";
import { formatFullDate, formatMonth } from "@/lib/formatting/date";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/types";

type AppHeaderProps = {
  messages: Messages;
  member: HouseholdMember;
  locale: Locale;
};

export function AppHeader({ locale, member, messages }: AppHeaderProps) {
  const now = new Date();
  const dateLocale = locale === "ar" ? "ar-DZ" : "en-DZ";

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="flex min-h-[4.75rem] items-center justify-between gap-4 px-4 sm:px-6 xl:px-10">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {messages.shell.familyName}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="truncate font-display text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
              {formatMonth(now, dateLocale)}
            </h2>
            <span className="hidden text-xs text-muted-foreground md:inline">
              · {formatFullDate(now, dateLocale)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm sm:flex">
            <span className="size-2 rounded-full bg-[hsl(var(--success))]" />
            {messages.shell.signedIn}
          </div>
          {/* ADR 0003: the theme control is reachable at every viewport, not hidden
              below `sm` with no replacement. */}
          <div className="rounded-full border bg-card p-0.5 shadow-sm">
            <ThemeSwitcher
              darkLabel={messages.shell.themeDark}
              label={messages.shell.theme}
              lightLabel={messages.shell.themeLight}
              systemLabel={messages.shell.themeSystem}
            />
          </div>
          <DropdownMenu dir={locale === "ar" ? "rtl" : "ltr"}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group flex h-11 cursor-pointer items-center gap-2 rounded-full bg-primary ps-3 pe-2 text-sm font-semibold text-primary-foreground shadow-sm"
                aria-label={messages.shell.privateWorkspace}
              >
                <span className="grid size-6 place-items-center rounded-full bg-white/12">
                  <UserRound aria-hidden="true" className="size-3.5" />
                </span>
                <span className="hidden max-w-24 truncate sm:block">
                  {member.displayName}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="size-3.5 transition-transform group-data-[state=open]:rotate-180"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-64 rounded-2xl p-2 shadow-xl"
            >
              <DropdownMenuLabel className="rounded-xl bg-muted/65 px-3 py-2.5">
                <p className="truncate text-sm font-semibold">{member.displayName}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  @{member.username} ·{" "}
                  {member.role === "owner"
                    ? messages.shell.roleOwner
                    : messages.shell.roleMember}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuItem asChild className="mt-1 min-h-11 rounded-lg px-3 py-2">
                <Link href="/settings">
                  <Settings2 aria-hidden="true" className="size-4" />
                  {messages.navigation.settings}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="min-h-11 rounded-lg px-3 py-2">
                <Link href="/change-password">
                  <ShieldCheck aria-hidden="true" className="size-4" />
                  {messages.shell.changePassword}
                </Link>
              </DropdownMenuItem>
              <form action={logoutAction}>
                <input type="hidden" name="scope" value="local" />
                <DropdownMenuItem asChild className="min-h-11 rounded-lg px-3 py-2">
                  <button type="submit" className="w-full justify-start">
                    <LogOut aria-hidden="true" className="size-4" />
                    {messages.shell.signOutDevice}
                  </button>
                </DropdownMenuItem>
              </form>
              <form action={logoutAction}>
                <input type="hidden" name="scope" value="global" />
                <DropdownMenuItem
                  asChild
                  className="min-h-11 rounded-lg px-3 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <button type="submit" className="w-full justify-start">
                    <LogOut aria-hidden="true" className="size-4" />
                    {messages.shell.signOutEverywhere}
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
