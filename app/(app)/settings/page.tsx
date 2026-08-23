import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpenCheck,
  CircleGauge,
  FolderCog,
  Languages,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundCog,
  UsersRound,
} from "lucide-react";

import { ExchangeRateForm } from "@/components/finance/exchange-rate-form";
import { HouseholdMemberForm } from "@/components/finance/household-member-form";
import { AllocationDefaultsForm } from "@/components/settings/allocation-defaults-form";
import { FamilySettingsForm } from "@/components/settings/family-settings-form";
import { FinancialHealthForm } from "@/components/settings/financial-health-form";
import { formatFullDate } from "@/lib/formatting/date";
import { getSettingsPageData } from "@/lib/settings/data";

export const metadata: Metadata = { title: "Settings" };

const sectionLinks = [
  { href: "#family", label: "Family", icon: UsersRound },
  { href: "#planning", label: "Planning", icon: SlidersHorizontal },
  { href: "#health", label: "Health", icon: CircleGauge },
  { href: "#rates", label: "Rates", icon: BadgeDollarSign },
  { href: "#members", label: "Members", icon: UserRoundCog },
] as const;

export default async function SettingsPage() {
  const data = await getSettingsPageData();
  if (!data) redirect("/login");

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="reveal relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[hsl(164_28%_12%)] px-5 py-7 text-white shadow-[0_28px_80px_hsl(164_30%_10%/0.22)] sm:px-9 sm:py-10">
        <div
          className="paper-grid absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
        />
        <div className="absolute -end-16 -top-20 size-72 rounded-full bg-[hsl(39_65%_68%)]/10 blur-3xl" />
        <div className="relative grid gap-8 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/70">
              <Settings2 aria-hidden="true" className="size-3.5" /> Phase 3B · Household
              controls
            </div>
            <h1 className="mt-5 max-w-2xl text-balance font-display text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Shape the system around your family.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68 sm:text-base">
              One calm control room for planning defaults, financial signals, family
              access, language, and manual valuations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:w-[25rem]">
            {[
              ["Owner", data.canManage ? "Full control" : "View only"],
              ["Language", data.family.locale === "ar" ? "العربية" : "English"],
              ["Audit", "Protected"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5"
              >
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.13em] text-white/45">
                  {label}
                </p>
                <p className="mt-1.5 text-sm font-semibold text-white/90">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <nav
        aria-label="Settings sections"
        className="flex snap-x gap-2 overflow-x-auto rounded-2xl border bg-card p-2"
      >
        {sectionLinks.map(({ href, icon: Icon, label }) => (
          <a
            key={href}
            href={href}
            className="inline-flex min-h-11 shrink-0 snap-start cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground transition hover:bg-primary/[0.06] hover:text-primary"
          >
            <Icon aria-hidden="true" className="size-4" /> {label}
          </a>
        ))}
      </nav>

      {!data.canManage ? (
        <section className="flex items-start gap-3 rounded-[1.2rem] border border-amber-500/25 bg-amber-500/[0.07] p-4 text-amber-900 dark:text-amber-200">
          <LockKeyhole aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Owner approval is required</p>
            <p className="mt-1 text-xs leading-5">
              You can review family settings, but only the household owner can change
              configuration or add members.
            </p>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="surface-shadow rounded-[1.3rem] border bg-card p-5">
          <FolderCog aria-hidden="true" className="size-5 text-primary" />
          <p className="mt-5 font-display text-3xl font-semibold tabular-nums">
            {data.inventory.activeCategories}
          </p>
          <p className="mt-1 text-sm font-medium">Active categories</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.inventory.customCategories} family-created
          </p>
        </article>
        <article className="surface-shadow rounded-[1.3rem] border bg-card p-5">
          <BookOpenCheck aria-hidden="true" className="size-5 text-primary" />
          <p className="mt-5 font-display text-3xl font-semibold tabular-nums">
            {data.inventory.activeIncomeSources}
          </p>
          <p className="mt-1 text-sm font-medium">Active income sources</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Category and source editors are the next Phase 3B slice.
          </p>
        </article>
        <article className="surface-shadow rounded-[1.3rem] border bg-card p-5">
          <Languages aria-hidden="true" className="size-5 text-primary" />
          <p className="mt-5 font-display text-3xl font-semibold">
            {data.family.locale.toUpperCase()}
          </p>
          <p className="mt-1 text-sm font-medium">Application locale</p>
          <p className="mt-1 text-xs text-muted-foreground">
            RTL-aware shell preferences are stored with the family.
          </p>
        </article>
      </section>

      <section
        id="family"
        className="scroll-mt-28 rounded-[1.45rem] border bg-card p-5 sm:p-7"
      >
        <SettingsHeading
          eyebrow="Household identity"
          title="Family Preferences"
          description="The shared name, currency, language, timezone, and date style for this private workspace."
          icon={UsersRound}
        />
        <div className="mt-6 border-t pt-6">
          <FamilySettingsForm canManage={data.canManage} family={data.family} />
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <section
          id="planning"
          className="scroll-mt-28 rounded-[1.45rem] border bg-card p-5 sm:p-7"
        >
          <SettingsHeading
            eyebrow="New-month starting point"
            title="Planning Defaults"
            description="These values prefill a new month. They never overwrite an active or historical plan."
            icon={SlidersHorizontal}
          />
          <div className="mt-6 border-t pt-6">
            <AllocationDefaultsForm
              canManage={data.canManage}
              defaults={data.allocationDefaults}
            />
          </div>
        </section>

        <section
          id="health"
          className="scroll-mt-28 rounded-[1.45rem] border bg-card p-5 sm:p-7"
        >
          <SettingsHeading
            eyebrow="Meaningful signals"
            title="Financial Health Thresholds"
            description="Choose where dashboard signals become healthy, watchful, or urgent."
            icon={CircleGauge}
          />
          <div className="mt-6 border-t pt-6">
            <FinancialHealthForm
              canManage={data.canManage}
              thresholds={data.financialHealth}
            />
          </div>
        </section>
      </div>

      <section
        id="rates"
        className="scroll-mt-28 rounded-[1.45rem] border bg-card p-5 sm:p-7"
      >
        <SettingsHeading
          eyebrow="Manual valuation only"
          title="Exchange Rates"
          description="Update EUR and USD without a market-data provider. Every DZD valuation uses your latest effective rate."
          icon={BadgeDollarSign}
        />
        <div className="mt-6 grid gap-4 border-t pt-6 xl:grid-cols-2">
          {data.exchangeRates.map((exchangeRate) => (
            <ExchangeRateForm
              key={exchangeRate.currency}
              defaultDate={data.defaultDate}
              exchangeRate={exchangeRate}
            />
          ))}
        </div>
      </section>

      <section
        id="members"
        className="scroll-mt-28 rounded-[1.45rem] border bg-card p-5 sm:p-7"
      >
        <SettingsHeading
          eyebrow="People & access"
          title="Family Members"
          description="See who can access the shared household and add the second secure account when ready."
          icon={UserRoundCog}
        />
        <div className="mt-6 grid gap-5 border-t pt-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            {data.members.map((member) => (
              <article key={member.id} className="rounded-2xl border bg-muted/25 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {member.displayName}
                      {member.id === data.currentUserId ? " · You" : ""}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      @{member.username}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-primary">
                    {member.role}
                  </span>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  {member.lastLoginAt
                    ? `Last sign-in ${formatFullDate(new Date(member.lastLoginAt))}`
                    : "No completed sign-in yet"}
                </p>
              </article>
            ))}
            <Link
              href="/change-password"
              className="group flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl border bg-background px-4 text-sm font-semibold transition hover:border-primary/30 hover:text-primary"
            >
              <span className="inline-flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="size-4" /> Change your
                password
              </span>
              <ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" />
            </Link>
          </div>
          {data.canManage ? (
            <div className="rounded-2xl border bg-muted/20 p-4 sm:p-5">
              <p className="mb-5 text-sm font-semibold">Add a secure family member</p>
              <HouseholdMemberForm />
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
              <div>
                <LockKeyhole
                  aria-hidden="true"
                  className="mx-auto size-5 text-muted-foreground"
                />
                <p className="mt-3 text-sm font-medium">
                  Member administration is locked.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ask the family owner to add or manage household access.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SettingsHeading({
  description,
  eyebrow,
  icon: Icon,
  title,
}: {
  description: string;
  eyebrow: string;
  icon: typeof Settings2;
  title: string;
}) {
  return (
    <div className="flex items-start justify-between gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-balance font-display text-2xl font-semibold tracking-[-0.035em]">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/[0.08] text-primary">
        <Icon aria-hidden="true" className="size-5" />
      </span>
    </div>
  );
}
