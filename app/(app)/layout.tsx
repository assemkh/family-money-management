import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { TabletRail } from "@/components/layout/tablet-rail";
import { requireHouseholdContext } from "@/lib/auth/household-context";

export const dynamic = "force-dynamic";

export default async function ApplicationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The authorization gate is the only household work this layout awaits. It cannot
  // move lower: nothing below may render before the caller is known to be a Member of
  // this Household. One memoized read resolves identity, role, locale, and messages,
  // so page data is the only thing left blocking the shell.
  const { direction, locale, member, messages } = await requireHouseholdContext();

  return (
    <div className="min-h-dvh" lang={locale} dir={direction}>
      <a
        href="#main-content"
        className="fixed start-4 top-3 z-[100] -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform focus:translate-y-0"
      >
        {messages.shell.skipToContent}
      </a>
      <AppSidebar messages={messages} />
      <TabletRail messages={messages} />
      <div className="md:ps-[4.5rem] shell:ps-[17.5rem]">
        <AppHeader locale={locale} messages={messages} member={member} />
        <main
          id="main-content"
          className="mx-auto w-full max-w-[96rem] px-4 pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-8 md:pb-12 xl:px-10"
        >
          {children}
        </main>
      </div>
      <MobileNavigation messages={messages} />
    </div>
  );
}
