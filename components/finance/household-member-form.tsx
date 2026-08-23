"use client";

import { UserPlus } from "lucide-react";
import { useActionState } from "react";

import { createHouseholdMemberAction } from "@/app/actions/finance";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";
import type { SettingsPageCopy } from "@/lib/i18n/settings-copy";

const fieldClass =
  "h-12 w-full rounded-xl border bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-55";

const defaultCopy: SettingsPageCopy["householdMemberForm"] = {
  displayName: "Display name",
  displayNamePlaceholder: "Family member’s name",
  username: "Username",
  usernamePlaceholder: "username",
  email: "Email",
  emailPlaceholder: "name@example.com",
  temporaryPassword: "Temporary password",
  passwordPlaceholder: "10+ chars, upper, lower, number, symbol",
  description:
    "The new member must replace this temporary password at first login. Unassigned family income sources can then be linked to their account.",
  creating: "Creating secure account…",
  add: "Add family member",
};

export function HouseholdMemberForm({
  copy = defaultCopy,
}: {
  copy?: SettingsPageCopy["householdMemberForm"];
}) {
  const [state, action, pending] = useActionState(
    createHouseholdMemberAction,
    initialFinanceActionState,
  );
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="member-name" className="mb-2 block text-sm font-medium">
          {copy.displayName}
        </label>
        <input
          id="member-name"
          name="displayName"
          required
          disabled={pending}
          placeholder={copy.displayNamePlaceholder}
          className={fieldClass}
        />
        <FieldError id="member-name-error" errors={state.fieldErrors?.displayName} />
      </div>
      <div>
        <label htmlFor="member-username" className="mb-2 block text-sm font-medium">
          {copy.username}
        </label>
        <input
          id="member-username"
          name="username"
          required
          disabled={pending}
          autoCapitalize="none"
          autoComplete="off"
          placeholder={copy.usernamePlaceholder}
          className={fieldClass}
        />
        <FieldError id="member-username-error" errors={state.fieldErrors?.username} />
      </div>
      <div>
        <label htmlFor="member-email" className="mb-2 block text-sm font-medium">
          {copy.email}
        </label>
        <input
          id="member-email"
          name="email"
          type="email"
          required
          disabled={pending}
          autoComplete="off"
          placeholder={copy.emailPlaceholder}
          className={fieldClass}
        />
        <FieldError id="member-email-error" errors={state.fieldErrors?.email} />
      </div>
      <div>
        <label htmlFor="member-password" className="mb-2 block text-sm font-medium">
          {copy.temporaryPassword}
        </label>
        <input
          id="member-password"
          name="temporaryPassword"
          type="password"
          required
          disabled={pending}
          autoComplete="new-password"
          placeholder={copy.passwordPlaceholder}
          className={fieldClass}
        />
        <FieldError
          id="member-password-error"
          errors={state.fieldErrors?.temporaryPassword}
        />
      </div>
      <div className="sm:col-span-2">
        <p className="mb-4 text-xs leading-5 text-muted-foreground">
          {copy.description}
        </p>
        <FormStatus state={state} />
        <button
          type="submit"
          disabled={pending}
          className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <UserPlus aria-hidden="true" className="size-4" />
          {pending ? copy.creating : copy.add}
        </button>
      </div>
    </form>
  );
}
