"use client";

import { PencilLine, X } from "lucide-react";
import { useRef } from "react";

import { MonthlyPlanForm } from "@/components/finance/monthly-plan-form";
import type { MonthlyPlanAllocation } from "@/lib/finance/read-models/planning/monthly-plan";

export function MonthlyPlanRevisionDialog({
  allocation,
  month,
  nextVersion,
}: {
  allocation: MonthlyPlanAllocation;
  month: string;
  nextVersion: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="mt-6 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        <PencilLine aria-hidden="true" className="size-4" />
        Revise allocation
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="plan-revision-title"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto rounded-[1.5rem] border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b bg-card/95 px-5 py-5 backdrop-blur sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              Immutable revision
            </p>
            <h2
              id="plan-revision-title"
              className="mt-1 font-display text-2xl font-semibold"
            >
              Create version {nextVersion}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close plan revision"
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border transition hover:bg-muted"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="px-5 py-6 sm:px-7">
          <p className="mb-6 text-sm leading-6 text-muted-foreground">
            The current allocation is prefilled. Your reason and the complete allocation
            will be stored as a new version; earlier versions remain unchanged.
          </p>
          <MonthlyPlanForm
            allocation={allocation}
            isRevision
            month={month}
            nextVersion={nextVersion}
          />
        </div>
      </dialog>
    </>
  );
}
