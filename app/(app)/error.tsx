"use client";

import { RefreshCcw, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Digest only. A financial read can carry household values in its message, and
    // this boundary must not widen that into the browser console.
    console.error("Workspace boundary error", error.digest ?? "no-digest");
  }, [error]);

  return (
    <section className="surface-shadow mx-auto mt-8 max-w-2xl rounded-[1.5rem] border bg-card p-6 text-center sm:p-10">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
        <ShieldAlert aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
        This section could not load
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em]">
        Your records are safe.
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
        Nothing was changed. Retry this section, or move to another part of the
        workspace and come back.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          <RefreshCcw aria-hidden="true" className="size-4" /> Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-5 text-sm font-semibold transition hover:bg-accent"
        >
          Back to dashboard
        </Link>
      </div>
    </section>
  );
}
