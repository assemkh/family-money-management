import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  Database,
  LayoutDashboard,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { hasSupabaseEnvironment } from "@/lib/env/public";
import { getMessages } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: getMessages().navigation.dashboard,
};

type StatusTone = "next" | "ready" | "setup";

type StatusCardProps = {
  description: string;
  icon: LucideIcon;
  label: string;
  title: string;
  tone: StatusTone;
};

const toneStyles: Record<StatusTone, string> = {
  next: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  ready: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  setup: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
};

function StatusCard({ description, icon: Icon, label, title, tone }: StatusCardProps) {
  return (
    <article className="surface-shadow rounded-[1.35rem] border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-11 place-items-center rounded-2xl bg-primary/[0.08] text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${toneStyles[tone]}`}
        >
          {label}
        </span>
      </div>
      <h3 className="mt-6 text-base font-semibold tracking-[-0.015em]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}

export default function DashboardFoundationPage() {
  const messages = getMessages();
  const supabaseConfigured = hasSupabaseEnvironment();

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="reveal relative overflow-hidden rounded-[1.6rem] border bg-primary px-6 py-8 text-primary-foreground shadow-[0_24px_60px_hsl(var(--primary)/0.18)] sm:px-9 sm:py-10 xl:px-12 xl:py-12">
        <div
          className="paper-grid absolute inset-0 opacity-[0.07]"
          aria-hidden="true"
        />
        <div
          className="absolute -end-16 -top-20 size-64 rounded-full border border-white/10 bg-white/[0.04]"
          aria-hidden="true"
        />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/75">
            <Sparkles aria-hidden="true" className="size-3.5" />
            {messages.dashboard.eyebrow}
          </div>
          <h1 className="mt-6 max-w-2xl font-display text-[2.5rem] font-semibold leading-[0.98] tracking-[-0.045em] text-balance sm:text-5xl xl:text-[3.6rem]">
            {messages.dashboard.title}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
            {messages.dashboard.description}
          </p>
        </div>
      </section>

      <section aria-labelledby="foundation-status-heading">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2
              id="foundation-status-heading"
              className="font-display text-2xl font-semibold tracking-[-0.03em] sm:text-3xl"
            >
              {messages.dashboard.statusTitle}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {messages.dashboard.statusDescription}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="size-3.5 text-primary" />
            {messages.shell.privateWorkspace}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatusCard
            description={messages.dashboard.applicationDescription}
            icon={LayoutDashboard}
            label={messages.dashboard.ready}
            title={messages.dashboard.applicationTitle}
            tone="ready"
          />
          <StatusCard
            description={
              supabaseConfigured
                ? messages.dashboard.supabaseConfigured
                : messages.dashboard.supabaseUnconfigured
            }
            icon={Database}
            label={
              supabaseConfigured
                ? messages.dashboard.ready
                : messages.dashboard.needsSetup
            }
            title={messages.dashboard.supabaseTitle}
            tone={supabaseConfigured ? "ready" : "setup"}
          />
          <StatusCard
            description={messages.dashboard.securityDescription}
            icon={LockKeyhole}
            label={messages.dashboard.nextPhase}
            title={messages.dashboard.securityTitle}
            tone="next"
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="surface-shadow rounded-[1.35rem] border bg-card p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
              <ArrowRight aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.03em]">
                {messages.dashboard.nextTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {messages.dashboard.nextDescription}
              </p>
            </div>
          </div>
          <ol className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              messages.dashboard.stepDatabase,
              messages.dashboard.stepHousehold,
              messages.dashboard.stepAccess,
            ].map((step, index) => (
              <li key={step} className="rounded-2xl border bg-muted/45 px-4 py-4">
                <span className="font-display text-2xl font-semibold text-accent/70">
                  0{index + 1}
                </span>
                <p className="mt-4 text-sm font-medium leading-5">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="relative overflow-hidden rounded-[1.35rem] border border-dashed bg-card/60 p-6 sm:p-7">
          <div className="absolute end-5 top-5 grid size-9 place-items-center rounded-full bg-primary/[0.07] text-primary">
            <Check aria-hidden="true" className="size-4" />
          </div>
          <div className="flex min-h-48 flex-col justify-end">
            <p className="max-w-sm font-display text-2xl font-semibold leading-tight tracking-[-0.03em]">
              {messages.dashboard.emptyTitle}
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              {messages.dashboard.emptyDescription}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
