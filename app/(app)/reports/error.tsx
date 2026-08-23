"use client";

import { FileWarning, RefreshCcw } from "lucide-react";
import { useEffect } from "react";

export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Reports boundary error", error);
  }, [error]);

  return (
    <section className="surface-shadow mx-auto mt-8 max-w-2xl rounded-[1.5rem] border bg-card p-6 text-center sm:p-10">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
        <FileWarning aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
        Report temporarily unavailable
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em]">
        The source records were not changed.
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
        The report could not be assembled right now. Retry the family-scoped queries;
        exports remain disabled until the data is available.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        <RefreshCcw aria-hidden="true" className="size-4" /> Try again
      </button>
    </section>
  );
}
