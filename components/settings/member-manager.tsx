"use client";

import { ChevronDown, KeyRound, Save, ShieldCheck } from "lucide-react";
import { useActionState } from "react";

import {
  resetMemberPasswordAction,
  updateMemberProfileAction,
} from "@/app/actions/settings";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import { MemberAccessControl } from "@/components/settings/member-access-control";
import { initialFinanceActionState } from "@/lib/finance/action-state";

type ManagedMember = {
  id: string;
  displayName: string;
  username: string;
  role: "owner" | "member";
  active: boolean;
  mustChangePassword: boolean;
  lastLoginLabel: string;
};

const fieldClass =
  "h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:opacity-55";

export function MemberManager({
  canManage,
  currentUserId,
  members,
}: {
  canManage: boolean;
  currentUserId: string;
  members: ManagedMember[];
}) {
  return (
    <div className="space-y-2">
      {members.map((member) => (
        <MemberRow
          key={member.id}
          canManage={canManage}
          current={member.id === currentUserId}
          member={member}
        />
      ))}
    </div>
  );
}

function MemberRow({
  canManage,
  current,
  member,
}: {
  canManage: boolean;
  current: boolean;
  member: ManagedMember;
}) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateMemberProfileAction,
    initialFinanceActionState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    resetMemberPasswordAction,
    initialFinanceActionState,
  );
  const canResetPassword = canManage && member.role !== "owner" && member.active;

  return (
    <details className="group rounded-2xl border bg-background open:border-primary/25">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 [&::-webkit-details-marker]:hidden">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl ${member.active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}
        >
          <ShieldCheck aria-hidden="true" className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {member.displayName}
            {current ? " · You" : ""}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            @{member.username} · {member.role} · {member.lastLoginLabel}
          </span>
        </span>
        {member.mustChangePassword ? (
          <span className="hidden rounded-full bg-amber-500/10 px-2 py-1 text-[0.65rem] font-semibold text-amber-800 sm:inline dark:text-amber-300">
            Password change due
          </span>
        ) : null}
        {!member.active ? (
          <span className="rounded-full bg-muted px-2 py-1 text-[0.65rem] font-semibold text-muted-foreground">
            Paused
          </span>
        ) : null}
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="grid gap-5 border-t p-4 lg:grid-cols-2">
        <form action={profileAction}>
          <input type="hidden" name="id" value={member.id} />
          <fieldset disabled={!canManage || profilePending}>
            <label
              htmlFor={`member-display-name-${member.id}`}
              className="mb-2 block text-xs font-medium"
            >
              Display name
            </label>
            <input
              id={`member-display-name-${member.id}`}
              name="displayName"
              defaultValue={member.displayName}
              required
              className={fieldClass}
              aria-invalid={Boolean(profileState.fieldErrors?.displayName)}
              aria-describedby={`member-display-name-${member.id}-error`}
            />
            <FieldError
              id={`member-display-name-${member.id}-error`}
              errors={profileState.fieldErrors?.displayName}
            />
          </fieldset>
          <div className="mt-3">
            <FormStatus state={profileState} />
            <button
              type="submit"
              disabled={!canManage || profilePending}
              className="mt-3 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <Save aria-hidden="true" className="size-3.5" />
              {profilePending ? "Saving…" : "Save name"}
            </button>
          </div>
        </form>

        {member.role === "owner" ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
            <p className="text-xs font-semibold">Protected owner account</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Owner access cannot be paused. Use the personal security controls below to
              change this account’s password or revoke sessions.
            </p>
          </div>
        ) : (
          <form action={passwordAction}>
            <input type="hidden" name="id" value={member.id} />
            <fieldset disabled={!canResetPassword || passwordPending}>
              <label
                htmlFor={`member-password-${member.id}`}
                className="mb-2 block text-xs font-medium"
              >
                New temporary password
              </label>
              <input
                id={`member-password-${member.id}`}
                name="temporaryPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="10+ chars, upper, lower, number, symbol"
                className={fieldClass}
                aria-invalid={Boolean(passwordState.fieldErrors?.temporaryPassword)}
                aria-describedby={`member-password-${member.id}-error`}
              />
              <FieldError
                id={`member-password-${member.id}-error`}
                errors={passwordState.fieldErrors?.temporaryPassword}
              />
            </fieldset>
            <div className="mt-3">
              <FormStatus state={passwordState} />
              <button
                type="submit"
                disabled={!canResetPassword || passwordPending}
                className="mt-3 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-4 text-xs font-semibold transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-55"
              >
                <KeyRound aria-hidden="true" className="size-3.5" />
                {passwordPending ? "Resetting…" : "Set temporary password"}
              </button>
            </div>
          </form>
        )}

        {canManage && member.role !== "owner" ? (
          <div className="flex justify-end border-t pt-4 lg:col-span-2">
            <MemberAccessControl
              active={member.active}
              id={member.id}
              label={member.displayName}
            />
          </div>
        ) : null}
      </div>
    </details>
  );
}
