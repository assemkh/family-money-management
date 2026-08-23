import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  BadgeDollarSign,
  BookOpenCheck,
  CircleGauge,
  FolderCog,
  Languages,
  LayoutDashboard,
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
import { CategoryManager } from "@/components/settings/category-manager";
import { DashboardPreferencesForm } from "@/components/settings/dashboard-preferences-form";
import { FamilySettingsForm } from "@/components/settings/family-settings-form";
import { FinancialHealthForm } from "@/components/settings/financial-health-form";
import { IncomeSourceManager } from "@/components/settings/income-source-manager";
import { MemberManager } from "@/components/settings/member-manager";
import { SecurityControls } from "@/components/settings/security-controls";
import { formatFullDate } from "@/lib/formatting/date";
import { getSettingsCopy } from "@/lib/i18n/settings-copy";
import { getSettingsPageData } from "@/lib/settings/data";

export const metadata: Metadata = { title: "Settings" };

const sectionLinks = [
  { href: "#family", key: "family", icon: UsersRound },
  { href: "#categories", key: "categories", icon: FolderCog },
  { href: "#sources", key: "sources", icon: BookOpenCheck },
  { href: "#planning", key: "planning", icon: SlidersHorizontal },
  { href: "#health", key: "health", icon: CircleGauge },
  { href: "#dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "#rates", key: "rates", icon: BadgeDollarSign },
  { href: "#members", key: "members", icon: UserRoundCog },
  { href: "#security", key: "security", icon: ShieldCheck },
] as const;

export default async function SettingsPage() {
  const data = await getSettingsPageData();
  if (!data) redirect("/login");
  const copy = getSettingsCopy(data.family.locale);
  const dateLocale = data.family.locale === "ar" ? "ar-DZ" : "en-DZ";

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
              <Settings2 aria-hidden="true" className="size-3.5" /> {copy.hero.badge}
            </div>
            <h1 className="mt-5 max-w-2xl text-balance font-display text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              {copy.hero.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68 sm:text-base">
              {copy.hero.description}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:w-[25rem]">
            {[
              [
                copy.hero.owner,
                data.canManage ? copy.hero.fullControl : copy.hero.viewOnly,
              ],
              [copy.hero.language, data.family.locale === "ar" ? "العربية" : "English"],
              [copy.hero.audit, copy.hero.protected],
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
        aria-label={copy.navigationLabel}
        className="flex snap-x gap-2 overflow-x-auto rounded-2xl border bg-card p-2"
      >
        {sectionLinks.map(({ href, icon: Icon, key }) => (
          <a
            key={href}
            href={href}
            className="inline-flex min-h-11 shrink-0 snap-start cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground transition hover:bg-primary/[0.06] hover:text-primary"
          >
            <Icon aria-hidden="true" className="size-4" /> {copy.navigation[key]}
          </a>
        ))}
      </nav>

      {!data.canManage ? (
        <section className="flex items-start gap-3 rounded-[1.2rem] border border-amber-500/25 bg-amber-500/[0.07] p-4 text-amber-900 dark:text-amber-200">
          <LockKeyhole aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{copy.ownerNotice.title}</p>
            <p className="mt-1 text-xs leading-5">{copy.ownerNotice.description}</p>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="surface-shadow rounded-[1.3rem] border bg-card p-5">
          <FolderCog aria-hidden="true" className="size-5 text-primary" />
          <p className="mt-5 font-display text-3xl font-semibold tabular-nums">
            {data.inventory.activeCategories}
          </p>
          <p className="mt-1 text-sm font-medium">{copy.inventory.activeCategories}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {copy.inventory.configuredCategories(data.inventory.configuredCategories)}
          </p>
        </article>
        <article className="surface-shadow rounded-[1.3rem] border bg-card p-5">
          <BookOpenCheck aria-hidden="true" className="size-5 text-primary" />
          <p className="mt-5 font-display text-3xl font-semibold tabular-nums">
            {data.inventory.activeIncomeSources}
          </p>
          <p className="mt-1 text-sm font-medium">{copy.inventory.activeSources}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {copy.inventory.sourceDescription}
          </p>
        </article>
        <article className="surface-shadow rounded-[1.3rem] border bg-card p-5">
          <Languages aria-hidden="true" className="size-5 text-primary" />
          <p className="mt-5 font-display text-3xl font-semibold">
            {data.family.locale.toUpperCase()}
          </p>
          <p className="mt-1 text-sm font-medium">{copy.inventory.locale}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {copy.inventory.localeDescription}
          </p>
        </article>
      </section>

      <section
        id="family"
        className="scroll-mt-28 rounded-[1.45rem] border bg-card p-5 sm:p-7"
      >
        <SettingsHeading {...copy.sections.family} icon={UsersRound} />
        <div className="mt-6 border-t pt-6">
          <FamilySettingsForm
            canManage={data.canManage}
            copy={copy.familyForm}
            family={data.family}
          />
        </div>
      </section>

      <section
        id="categories"
        className="scroll-mt-28 rounded-[1.45rem] border bg-card p-5 sm:p-7"
      >
        <SettingsHeading {...copy.sections.categories} icon={FolderCog} />
        <div className="mt-6 border-t pt-6">
          <CategoryManager canManage={data.canManage} categories={data.categories} />
        </div>
      </section>

      <section
        id="sources"
        className="scroll-mt-28 rounded-[1.45rem] border bg-card p-5 sm:p-7"
      >
        <SettingsHeading {...copy.sections.sources} icon={BookOpenCheck} />
        <div className="mt-6 border-t pt-6">
          <IncomeSourceManager
            canManage={data.canManage}
            members={data.members.map((member) => ({
              active: member.active,
              id: member.id,
              displayName: member.displayName,
            }))}
            sources={data.incomeSources}
          />
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <section
          id="planning"
          className="scroll-mt-28 rounded-[1.45rem] border bg-card p-5 sm:p-7"
        >
          <SettingsHeading {...copy.sections.planning} icon={SlidersHorizontal} />
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
          <SettingsHeading {...copy.sections.health} icon={CircleGauge} />
          <div className="mt-6 border-t pt-6">
            <FinancialHealthForm
              canManage={data.canManage}
              thresholds={data.financialHealth}
            />
          </div>
        </section>
      </div>

      <section
        id="dashboard"
        className="scroll-mt-28 rounded-[1.45rem] border bg-card p-5 sm:p-7"
      >
        <SettingsHeading {...copy.sections.dashboard} icon={LayoutDashboard} />
        <div className="mt-6 border-t pt-6">
          <DashboardPreferencesForm
            canManage={data.canManage}
            preferences={data.dashboardPreferences}
          />
        </div>
      </section>

      <section
        id="rates"
        className="scroll-mt-28 rounded-[1.45rem] border bg-card p-5 sm:p-7"
      >
        <SettingsHeading {...copy.sections.rates} icon={BadgeDollarSign} />
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
        <SettingsHeading {...copy.sections.members} icon={UserRoundCog} />
        <div className="mt-6 grid gap-5 border-t pt-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div>
            <MemberManager
              canManage={data.canManage}
              currentUserId={data.currentUserId}
              members={data.members.map((member) => ({
                ...member,
                roleLabel:
                  member.role === "owner" ? copy.hero.owner : copy.members.memberRole,
                lastLoginLabel: member.lastLoginAt
                  ? copy.members.lastSignIn(
                      formatFullDate(new Date(member.lastLoginAt), dateLocale),
                    )
                  : copy.members.noSignIn,
              }))}
            />
          </div>
          {data.canManage ? (
            <div className="rounded-2xl border bg-muted/20 p-4 sm:p-5">
              <p className="mb-5 text-sm font-semibold">{copy.members.addTitle}</p>
              <HouseholdMemberForm />
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
              <div>
                <LockKeyhole
                  aria-hidden="true"
                  className="mx-auto size-5 text-muted-foreground"
                />
                <p className="mt-3 text-sm font-medium">{copy.members.lockedTitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {copy.members.lockedDescription}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section
        id="security"
        className="scroll-mt-28 rounded-[1.45rem] border bg-card p-5 sm:p-7"
      >
        <SettingsHeading {...copy.sections.security} icon={ShieldCheck} />
        <div className="mt-6 border-t pt-6">
          <SecurityControls />
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
