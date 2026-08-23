"use client";

import { Eye, Gauge, Save } from "lucide-react";
import { useActionState } from "react";

import { updateDashboardPreferencesAction } from "@/app/actions/settings";
import { FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";
import type { SettingsPageCopy } from "@/lib/i18n/settings-copy";
import type { DashboardPreferences } from "@/lib/settings/config";

const selectClass =
  "h-12 w-full rounded-xl border bg-background px-3 text-sm font-medium outline-none transition focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:opacity-55";

const widgetOptions = [
  "showHealth",
  "showPlan",
  "showBreakdowns",
  "showNetWorth",
  "showGoals",
] as const;

export function DashboardPreferencesForm({
  canManage,
  copy,
  preferences,
}: {
  canManage: boolean;
  copy: SettingsPageCopy["dashboardForm"];
  preferences: DashboardPreferences;
}) {
  const [state, action, pending] = useActionState(
    updateDashboardPreferencesAction,
    initialFinanceActionState,
  );

  return (
    <form action={action}>
      <fieldset disabled={!canManage || pending} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="dashboard-kpi-mode"
              className="mb-2 block text-sm font-medium"
            >
              {copy.kpiDensity}
            </label>
            <select
              id="dashboard-kpi-mode"
              name="kpiMode"
              defaultValue={preferences.kpiMode}
              className={selectClass}
            >
              <option value="full">{copy.fullCards}</option>
              <option value="compact">{copy.compactCards}</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="dashboard-default-month"
              className="mb-2 block text-sm font-medium"
            >
              {copy.defaultMonth}
            </label>
            <select
              id="dashboard-default-month"
              name="defaultMonth"
              defaultValue={preferences.defaultMonth}
              className={selectClass}
            >
              <option value="current">{copy.currentMonth}</option>
              <option value="previous">{copy.previousMonth}</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="dashboard-trend-range"
              className="mb-2 block text-sm font-medium"
            >
              {copy.chartRange}
            </label>
            <select
              id="dashboard-trend-range"
              name="trendRange"
              defaultValue={preferences.trendRange}
              className={selectClass}
            >
              <option value="3">3 {copy.months}</option>
              <option value="6">6 {copy.months}</option>
              <option value="12">12 {copy.months}</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Eye aria-hidden="true" className="size-4 text-primary" />
            <p className="text-sm font-semibold">{copy.visibleAreas}</p>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {widgetOptions.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border bg-muted/20 p-4 transition hover:border-primary/25 has-[:checked]:border-primary/25 has-[:checked]:bg-primary/[0.045]"
              >
                <input
                  type="checkbox"
                  name={option}
                  defaultChecked={preferences[option]}
                  className="mt-0.5 size-4 shrink-0 accent-[hsl(var(--primary))]"
                />
                <span>
                  <span className="block text-sm font-semibold">
                    {copy.widgets[option].label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {copy.widgets[option].description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <div className="mt-5">
        <FormStatus state={state} />
        <button
          type="submit"
          disabled={!canManage || pending}
          className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {pending ? (
            <Gauge aria-hidden="true" className="size-4 animate-pulse" />
          ) : (
            <Save aria-hidden="true" className="size-4" />
          )}
          {pending ? copy.saving : copy.save}
        </button>
      </div>
    </form>
  );
}
