"use client";

import { Eye, Gauge, Save } from "lucide-react";
import { useActionState } from "react";

import { updateDashboardPreferencesAction } from "@/app/actions/settings";
import { FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";
import type { DashboardPreferences } from "@/lib/settings/config";

const selectClass =
  "h-12 w-full rounded-xl border bg-background px-3 text-sm font-medium outline-none transition focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:opacity-55";

const widgetOptions = [
  {
    key: "showHealth",
    label: "Financial-health signals",
    description: "Status cards beside the money-flow chart.",
  },
  {
    key: "showPlan",
    label: "Plan vs actual",
    description: "Monthly allocation targets compared with real activity.",
  },
  {
    key: "showBreakdowns",
    label: "Breakdown charts",
    description: "Expense and asset-allocation composition.",
  },
  {
    key: "showNetWorth",
    label: "Net-worth trend",
    description: "Historical snapshot direction.",
  },
  {
    key: "showGoals",
    label: "Savings goals",
    description: "Shared milestone progress at the bottom of the dashboard.",
  },
] as const;

export function DashboardPreferencesForm({
  canManage,
  preferences,
}: {
  canManage: boolean;
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
              KPI density
            </label>
            <select
              id="dashboard-kpi-mode"
              name="kpiMode"
              defaultValue={preferences.kpiMode}
              className={selectClass}
            >
              <option value="full">Full cards</option>
              <option value="compact">Compact cards</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="dashboard-default-month"
              className="mb-2 block text-sm font-medium"
            >
              Default month
            </label>
            <select
              id="dashboard-default-month"
              name="defaultMonth"
              defaultValue={preferences.defaultMonth}
              className={selectClass}
            >
              <option value="current">Current month</option>
              <option value="previous">Previous month</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="dashboard-trend-range"
              className="mb-2 block text-sm font-medium"
            >
              Chart range
            </label>
            <select
              id="dashboard-trend-range"
              name="trendRange"
              defaultValue={preferences.trendRange}
              className={selectClass}
            >
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">12 months</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Eye aria-hidden="true" className="size-4 text-primary" />
            <p className="text-sm font-semibold">Visible dashboard areas</p>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {widgetOptions.map((option) => (
              <label
                key={option.key}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border bg-muted/20 p-4 transition hover:border-primary/25 has-[:checked]:border-primary/25 has-[:checked]:bg-primary/[0.045]"
              >
                <input
                  type="checkbox"
                  name={option.key}
                  defaultChecked={preferences[option.key]}
                  className="mt-0.5 size-4 shrink-0 accent-[hsl(var(--primary))]"
                />
                <span>
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {option.description}
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
          {pending ? "Saving…" : "Save dashboard preferences"}
        </button>
      </div>
    </form>
  );
}
