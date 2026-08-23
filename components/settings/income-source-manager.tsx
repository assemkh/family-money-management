"use client";

import { ChevronDown, Plus, Save } from "lucide-react";
import { useActionState } from "react";

import {
  createIncomeSourceAction,
  updateIncomeSourceAction,
} from "@/app/actions/settings";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import { ArchiveConfirmation } from "@/components/settings/archive-confirmation";
import { initialFinanceActionState } from "@/lib/finance/action-state";
import type { SettingsPageCopy } from "@/lib/i18n/settings-copy";
import type { ManagedIncomeSource, SettingsMemberOption } from "@/lib/settings/config";

const fieldClass =
  "h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:opacity-55";

export function IncomeSourceManager({
  archiveCopy,
  canManage,
  copy,
  members,
  sources,
}: {
  archiveCopy: SettingsPageCopy["archiveConfirmation"];
  canManage: boolean;
  copy: SettingsPageCopy["incomeSourceManager"];
  members: SettingsMemberOption[];
  sources: ManagedIncomeSource[];
}) {
  const [state, action, pending] = useActionState(
    createIncomeSourceAction,
    initialFinanceActionState,
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
      <form action={action} className="rounded-2xl border bg-muted/20 p-4 sm:p-5">
        <p className="text-sm font-semibold">{copy.addTitle}</p>
        <fieldset
          disabled={!canManage || pending}
          className="mt-4 grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label
              htmlFor="new-source-name"
              className="mb-1.5 block text-xs font-medium"
            >
              {copy.name}
            </label>
            <input
              id="new-source-name"
              name="name"
              required
              autoComplete="off"
              className={fieldClass}
              aria-invalid={Boolean(state.fieldErrors?.name)}
              aria-describedby="new-source-name-error"
            />
            <FieldError id="new-source-name-error" errors={state.fieldErrors?.name} />
          </div>
          <div>
            <label
              htmlFor="new-source-member"
              className="mb-1.5 block text-xs font-medium"
            >
              {copy.member}
            </label>
            <select id="new-source-member" name="ownerMemberId" className={fieldClass}>
              <option value="">{copy.unassigned}</option>
              {members.map((member) => (
                <option key={member.id} value={member.id} disabled={!member.active}>
                  {member.displayName}
                  {member.active ? "" : ` · ${copy.paused}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="new-source-order"
              className="mb-1.5 block text-xs font-medium"
            >
              {copy.displayOrder}
            </label>
            <input
              id="new-source-order"
              name="sortOrder"
              type="number"
              min="0"
              step="1"
              defaultValue="100"
              required
              className={fieldClass}
            />
          </div>
        </fieldset>
        <div className="mt-4">
          <FormStatus state={state} />
          <button
            type="submit"
            disabled={!canManage || pending}
            className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Plus aria-hidden="true" className="size-4" />
            {pending ? copy.adding : copy.add}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {sources.map((source) => (
          <IncomeSourceRow
            key={source.id}
            archiveCopy={archiveCopy}
            canManage={canManage}
            copy={copy}
            members={members}
            source={source}
          />
        ))}
      </div>
    </div>
  );
}

function IncomeSourceRow({
  archiveCopy,
  members,
  source,
  canManage,
  copy,
}: {
  archiveCopy: SettingsPageCopy["archiveConfirmation"];
  members: SettingsMemberOption[];
  source: ManagedIncomeSource;
  canManage: boolean;
  copy: SettingsPageCopy["incomeSourceManager"];
}) {
  const [state, action, pending] = useActionState(
    updateIncomeSourceAction,
    initialFinanceActionState,
  );
  const memberName = members.find(
    (member) => member.id === source.ownerMemberId,
  )?.displayName;

  return (
    <details className="group rounded-2xl border bg-background open:border-primary/25">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 [&::-webkit-details-marker]:hidden">
        <span
          className={`size-2.5 shrink-0 rounded-full ${source.active ? "bg-emerald-500" : "bg-muted-foreground/35"}`}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{source.name}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {memberName ?? copy.unassigned} · {copy.order} {source.sortOrder}
          </span>
        </span>
        {!source.active ? (
          <span className="rounded-full bg-muted px-2 py-1 text-[0.65rem] font-semibold text-muted-foreground">
            {copy.archived}
          </span>
        ) : null}
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-t p-4">
        <form action={action}>
          <input type="hidden" name="id" value={source.id} />
          <fieldset
            disabled={!canManage || pending}
            className="grid gap-3 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label
                htmlFor={`source-name-${source.id}`}
                className="mb-1.5 block text-xs font-medium"
              >
                {copy.name}
              </label>
              <input
                id={`source-name-${source.id}`}
                name="name"
                defaultValue={source.name}
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label
                htmlFor={`source-member-${source.id}`}
                className="mb-1.5 block text-xs font-medium"
              >
                {copy.member}
              </label>
              <select
                id={`source-member-${source.id}`}
                name="ownerMemberId"
                defaultValue={source.ownerMemberId ?? ""}
                className={fieldClass}
              >
                <option value="">{copy.unassigned}</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id} disabled={!member.active}>
                    {member.displayName}
                    {member.active ? "" : ` · ${copy.paused}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor={`source-order-${source.id}`}
                className="mb-1.5 block text-xs font-medium"
              >
                {copy.displayOrder}
              </label>
              <input
                id={`source-order-${source.id}`}
                name="sortOrder"
                type="number"
                min="0"
                step="1"
                defaultValue={source.sortOrder}
                required
                className={fieldClass}
              />
            </div>
          </fieldset>
          <div className="mt-3">
            <FormStatus state={state} />
          </div>
          <div className="mt-4">
            <button
              type="submit"
              disabled={!canManage || pending}
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <Save aria-hidden="true" className="size-3.5" />
              {pending ? copy.saving : copy.saveChanges}
            </button>
          </div>
        </form>
        {canManage ? (
          <div className="mt-3 flex justify-end border-t pt-3">
            <ArchiveConfirmation
              active={source.active}
              copy={archiveCopy}
              id={source.id}
              kind="income-source"
              label={source.name}
            />
          </div>
        ) : null}
      </div>
    </details>
  );
}
