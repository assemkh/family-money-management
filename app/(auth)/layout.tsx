import { BrandMark } from "@/components/brand/brand-mark";
import { getMessages } from "@/lib/i18n/config";

export default function AuthenticationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const messages = getMessages();

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 sm:py-8">
      <div className="paper-grid absolute inset-0 opacity-30" aria-hidden="true" />
      <div
        className="absolute -start-32 top-1/4 size-[28rem] rounded-full bg-accent/[0.08] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -end-40 bottom-0 size-[32rem] rounded-full bg-primary/[0.09] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col">
        <div className="w-fit rounded-2xl bg-[hsl(var(--sidebar))] px-3.5 py-3 shadow-xl">
          <BrandMark messages={messages} />
        </div>
        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <section className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              {messages.auth.eyebrow}
            </p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.94] tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl">
              {messages.auth.title}
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
              {messages.auth.description}
            </p>
          </section>
          <div>{children}</div>
        </div>
      </div>
    </main>
  );
}
