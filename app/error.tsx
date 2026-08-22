"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { messages } from "@/lib/i18n/messages/en";

export default function ApplicationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application boundary error", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="surface-shadow w-full max-w-md rounded-[1.5rem] border bg-card p-7 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle aria-hidden="true" className="size-5" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.035em]">
          {messages.feedback.unexpectedTitle}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {messages.feedback.unexpectedDescription}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          {messages.feedback.retry}
        </button>
      </div>
    </main>
  );
}
