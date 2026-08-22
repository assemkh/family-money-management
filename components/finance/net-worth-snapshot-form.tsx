"use client";

import { Camera } from "lucide-react";
import { useActionState } from "react";

import { captureNetWorthSnapshotAction } from "@/app/actions/finance";
import { FormStatus } from "@/components/finance/form-feedback";
import { initialFinanceActionState } from "@/lib/finance/action-state";

export function NetWorthSnapshotForm({
  captured,
  disabled,
  month,
}: {
  captured: boolean;
  disabled: boolean;
  month: string;
}) {
  const [state, action, pending] = useActionState(
    captureNetWorthSnapshotAction,
    initialFinanceActionState,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="month" value={month} />
      <button
        type="submit"
        disabled={pending || disabled}
        className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
      >
        <Camera aria-hidden="true" className="size-4" />
        {pending
          ? "Capturing snapshot…"
          : captured
            ? "Refresh current-month snapshot"
            : "Capture current-month snapshot"}
      </button>
      <FormStatus state={state} />
    </form>
  );
}
