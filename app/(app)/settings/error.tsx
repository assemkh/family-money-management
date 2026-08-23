"use client";

import { RefreshCcw, ShieldAlert } from "lucide-react";
import { useEffect } from "react";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Settings boundary error", error);
  }, [error]);

  return (
    <section className="surface-shadow mx-auto mt-8 max-w-2xl rounded-[1.5rem] border bg-card p-6 text-center sm:p-10">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
        <ShieldAlert aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
        Settings temporarily unavailable
      </p>
      <h1 className="mt-2 text-balance font-display text-3xl font-semibold tracking-[-0.04em]">
        Your saved configuration is safe.
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
        Household settings could not be loaded right now. No preference was changed;
        retry when you are ready.
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
