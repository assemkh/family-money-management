import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { readAuthState } from "@/lib/auth/session";
import { getMessages } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function ApplicationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const messages = getMessages();
  const authState = await readAuthState();

  if (authState.status !== "authenticated") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="fixed start-4 top-3 z-[100] -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform focus:translate-y-0"
      >
        {messages.shell.skipToContent}
      </a>
      <AppSidebar messages={messages} />
      <div className="lg:ps-[17.5rem]">
        <AppHeader authenticated messages={messages} />
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
