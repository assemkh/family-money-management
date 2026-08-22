"use client";

import { Archive, Pause, Play } from "lucide-react";
import { useActionState } from "react";

import { setSavingsGoalStatusAction } from "@/app/actions/finance";
import { initialFinanceActionState } from "@/lib/finance/action-state";

export function SavingsGoalStatusButton({
  goalId,
  status,
}: {
  goalId: string;
  status: "active" | "paused" | "completed" | "cancelled";
}) {
  const [state, action, pending] = useActionState(
    setSavingsGoalStatusAction,
    initialFinanceActionState,
  );
  const nextStatus = status === "paused" ? "active" : "paused";
  const ToggleIcon = status === "paused" ? Play : Pause;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "completed" ? (
        <form action={action}>
          <input type="hidden" name="goalId" value={goalId} />
          <input type="hidden" name="status" value={nextStatus} />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border bg-background px-3 text-xs font-semibold transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-55"
          >
            <ToggleIcon aria-hidden="true" className="size-3.5" />
            {status === "paused" ? "Resume" : "Pause"}
          </button>
        </form>
      ) : null}
      <form
        action={action}
        onSubmit={(event) => {
          if (
            !window.confirm("Archive this goal? Its contribution history will remain.")
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="goalId" value={goalId} />
        <input type="hidden" name="status" value="cancelled" />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border bg-background px-3 text-xs font-semibold text-muted-foreground transition hover:border-destructive/30 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Archive aria-hidden="true" className="size-3.5" />
          Archive
        </button>
      </form>
      {state.status === "error" ? (
        <p className="w-full text-xs text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
