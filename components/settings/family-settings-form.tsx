"use client";

import { Save } from "lucide-react";
import { useActionState } from "react";

import { updateFamilySettingsAction } from "@/app/actions/settings";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";

type FamilySettings = {
  name: string;
  baseCurrency: "DZD" | "EUR" | "USD";
  timezone: string;
  locale: "en" | "ar";
  dateFormat: string;
};

const fieldClass =
  "h-12 w-full rounded-xl border bg-background px-3 text-sm shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-55";

export function FamilySettingsForm({
  canManage,
  family,
}: {
  canManage: boolean;
  family: FamilySettings;
}) {
  const [state, action, pending] = useActionState(
    updateFamilySettingsAction,
    initialFinanceActionState,
  );

  return (
    <form action={action}>
      <fieldset disabled={!canManage || pending} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="family-name" className="mb-2 block text-sm font-medium">
            Family name
          </label>
          <input
            id="family-name"
            name="name"
            defaultValue={family.name}
            autoComplete="organization"
            required
            className={fieldClass}
            aria-invalid={Boolean(state.fieldErrors?.name)}
            aria-describedby="family-name-error"
          />
          <FieldError id="family-name-error" errors={state.fieldErrors?.name} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Base currency</p>
          <input type="hidden" name="baseCurrency" value="DZD" />
          <div className="flex min-h-12 items-center rounded-xl border bg-muted/35 px-3 text-sm">
            <span className="font-semibold">{family.baseCurrency}</span>
            <span className="ms-2 text-xs text-muted-foreground">
              · Fixed for DZD valuations
            </span>
          </div>
        </div>
        <div>
          <label htmlFor="family-language" className="mb-2 block text-sm font-medium">
            Interface language
          </label>
          <select
            id="family-language"
            name="locale"
            defaultValue={family.locale}
            className={fieldClass}
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Timezone</p>
          <input type="hidden" name="timezone" value="Africa/Algiers" />
          <div className="flex min-h-12 items-center rounded-xl border bg-muted/35 px-3 text-sm font-semibold">
            {family.timezone}
          </div>
        </div>
        <div>
          <label
            htmlFor="family-date-format"
            className="mb-2 block text-sm font-medium"
          >
            Date format
          </label>
          <select
            id="family-date-format"
            name="dateFormat"
            defaultValue={family.dateFormat}
            className={fieldClass}
          >
            <option value="dd/MM/yyyy">DD/MM/YYYY</option>
            <option value="MM/dd/yyyy">MM/DD/YYYY</option>
            <option value="yyyy-MM-dd">YYYY-MM-DD</option>
          </select>
        </div>
      </fieldset>
      <div className="mt-5">
        <FormStatus state={state} />
        <button
          type="submit"
          disabled={!canManage || pending}
          className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Save aria-hidden="true" className="size-4" />
          {pending ? "Saving…" : "Save family preferences"}
        </button>
      </div>
    </form>
  );
}
