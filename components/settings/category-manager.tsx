"use client";

import { ChevronDown, Plus, Save } from "lucide-react";
import { useActionState, useState } from "react";

import {
  createExpenseCategoryAction,
  updateExpenseCategoryAction,
} from "@/app/actions/settings";
import { FieldError, FormStatus } from "@/components/finance/form-feedback";
import { ArchiveConfirmation } from "@/components/settings/archive-confirmation";
import { initialFinanceActionState } from "@/lib/finance/action-state";
import type { SettingsPageCopy } from "@/lib/i18n/settings-copy";
import {
  categoryTypes,
  type CategoryType,
  type ManagedCategory,
} from "@/lib/settings/config";

const fieldClass =
  "h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:opacity-55";

export function CategoryManager({
  archiveCopy,
  canManage,
  categories,
  copy,
}: {
  archiveCopy: SettingsPageCopy["archiveConfirmation"];
  canManage: boolean;
  categories: ManagedCategory[];
  copy: SettingsPageCopy["categoryManager"];
}) {
  const [state, action, pending] = useActionState(
    createExpenseCategoryAction,
    initialFinanceActionState,
  );
  const [selectedType, setSelectedType] = useState<CategoryType>("essentials");
  const parentOptions = categories.filter(
    (category) =>
      category.active &&
      category.parentCategoryId === null &&
      category.type === selectedType,
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
              htmlFor="new-category-name"
              className="mb-1.5 block text-xs font-medium"
            >
              {copy.name}
            </label>
            <input
              id="new-category-name"
              name="name"
              required
              autoComplete="off"
              className={fieldClass}
              aria-invalid={Boolean(state.fieldErrors?.name)}
              aria-describedby="new-category-name-error"
            />
            <FieldError id="new-category-name-error" errors={state.fieldErrors?.name} />
          </div>
          <div>
            <label
              htmlFor="new-category-type"
              className="mb-1.5 block text-xs font-medium"
            >
              {copy.type}
            </label>
            <select
              id="new-category-type"
              name="type"
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value as CategoryType)}
              className={fieldClass}
            >
              {categoryTypes.map((type) => (
                <option key={type} value={type}>
                  {copy.types[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="new-category-order"
              className="mb-1.5 block text-xs font-medium"
            >
              {copy.displayOrder}
            </label>
            <input
              id="new-category-order"
              name="sortOrder"
              type="number"
              min="0"
              step="1"
              defaultValue="100"
              required
              className={fieldClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="new-category-parent"
              className="mb-1.5 block text-xs font-medium"
            >
              {copy.parent}
            </label>
            <select
              id="new-category-parent"
              name="parentCategoryId"
              className={fieldClass}
            >
              <option value="">{copy.topLevel}</option>
              {parentOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <FieldError
              id="new-category-parent-error"
              errors={state.fieldErrors?.parentCategoryId}
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
        {categories.map((category) => (
          <CategoryRow
            key={category.id}
            canManage={canManage}
            category={category}
            categories={categories}
            archiveCopy={archiveCopy}
            copy={copy}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryRow({
  archiveCopy,
  categories,
  category,
  canManage,
  copy,
}: {
  archiveCopy: SettingsPageCopy["archiveConfirmation"];
  categories: ManagedCategory[];
  category: ManagedCategory;
  canManage: boolean;
  copy: SettingsPageCopy["categoryManager"];
}) {
  const [state, action, pending] = useActionState(
    updateExpenseCategoryAction,
    initialFinanceActionState,
  );
  const [selectedType, setSelectedType] = useState<CategoryType>(category.type);
  const parentOptions = categories.filter(
    (candidate) =>
      candidate.id !== category.id &&
      candidate.active &&
      candidate.parentCategoryId === null &&
      candidate.type === selectedType,
  );
  const parentName = categories.find(
    (candidate) => candidate.id === category.parentCategoryId,
  )?.name;

  return (
    <details className="group rounded-2xl border bg-background open:border-primary/25">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 [&::-webkit-details-marker]:hidden">
        <span
          className={`size-2.5 shrink-0 rounded-full ${category.active ? "bg-emerald-500" : "bg-muted-foreground/35"}`}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{category.name}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {copy.types[category.type]}
            {parentName
              ? ` · ${copy.under} ${parentName}`
              : ` · ${copy.topLevel}`} · {copy.order} {category.sortOrder}
          </span>
        </span>
        {!category.active ? (
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
          <input type="hidden" name="id" value={category.id} />
          <fieldset
            disabled={!canManage || pending}
            className="grid gap-3 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label
                htmlFor={`category-name-${category.id}`}
                className="mb-1.5 block text-xs font-medium"
              >
                {copy.name}
              </label>
              <input
                id={`category-name-${category.id}`}
                name="name"
                defaultValue={category.name}
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label
                htmlFor={`category-type-${category.id}`}
                className="mb-1.5 block text-xs font-medium"
              >
                {copy.type}
              </label>
              <select
                id={`category-type-${category.id}`}
                name="type"
                value={selectedType}
                onChange={(event) =>
                  setSelectedType(event.target.value as CategoryType)
                }
                className={fieldClass}
              >
                {categoryTypes.map((type) => (
                  <option key={type} value={type}>
                    {copy.types[type]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor={`category-order-${category.id}`}
                className="mb-1.5 block text-xs font-medium"
              >
                {copy.displayOrder}
              </label>
              <input
                id={`category-order-${category.id}`}
                name="sortOrder"
                type="number"
                min="0"
                step="1"
                defaultValue={category.sortOrder}
                required
                className={fieldClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor={`category-parent-${category.id}`}
                className="mb-1.5 block text-xs font-medium"
              >
                {copy.parent}
              </label>
              <select
                id={`category-parent-${category.id}`}
                name="parentCategoryId"
                defaultValue={category.parentCategoryId ?? ""}
                className={fieldClass}
              >
                <option value="">{copy.topLevel}</option>
                {parentOptions.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
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
              active={category.active}
              id={category.id}
              kind="category"
              label={category.name}
              copy={archiveCopy}
            />
          </div>
        ) : null}
      </div>
    </details>
  );
}
