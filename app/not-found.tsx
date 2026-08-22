import { Compass } from "lucide-react";
import Link from "next/link";

import { getMessages } from "@/lib/i18n/config";

export default function NotFoundPage() {
  const messages = getMessages();

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="max-w-lg text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Compass aria-hidden="true" className="size-5" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          404
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-[-0.045em]">
          {messages.feedback.notFoundTitle}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">
          {messages.feedback.notFoundDescription}
        </p>
        <Link
          href="/dashboard"
          className="mt-7 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          {messages.feedback.goHome}
        </Link>
      </div>
    </main>
  );
}
