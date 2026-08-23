import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { readCurrentProfile } from "@/lib/auth/profile";
import { readAuthState } from "@/lib/auth/session";
import { getDirection, getMessages } from "@/lib/i18n/config";
import { getFamilyLocale } from "@/lib/settings/data";

export const dynamic = "force-dynamic";

export default async function ApplicationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const authState = await readAuthState();

  if (authState.status !== "authenticated") {
    redirect("/login");
  }

  const profile = await readCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.mustChangePassword) {
    redirect("/change-password");
  }

  const locale = await getFamilyLocale(profile.familyId);
  const messages = getMessages(locale);

  return (
    <div className="min-h-screen" lang={locale} dir={getDirection(locale)}>
      <a
        href="#main-content"
        className="fixed start-4 top-3 z-[100] -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform focus:translate-y-0"
      >
        {messages.shell.skipToContent}
      </a>
      <AppSidebar messages={messages} />
      <div className="lg:ps-[17.5rem]">
        <AppHeader locale={locale} messages={messages} profile={profile} />
        <main
          id="main-content"
          className="mx-auto w-full max-w-[96rem] px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:pb-12 xl:px-10"
        >
          {children}
        </main>
      </div>
      <MobileNavigation messages={messages} />
    </div>
  );
}
