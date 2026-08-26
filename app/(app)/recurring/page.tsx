import type { Metadata } from "next";
import { CalendarClock, Repeat2 } from "lucide-react";
import { redirect } from "next/navigation";
import { RecurringEntryForm } from "@/components/finance/recurring-entry-form";
import { formatMoney } from "@/lib/formatting/money";
import { getRecurringPageData } from "@/lib/finance/read-models/planning/recurring";
export const metadata: Metadata = { title: "Recurring" };
export default async function RecurringPage() {
  const data = await getRecurringPageData();
  if (!data) redirect("/login");
  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-[1.6rem] border bg-primary px-6 py-7 text-primary-foreground sm:px-9 sm:py-9">
        <div
          className="paper-grid absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/75">
            <Repeat2 className="size-3.5" aria-hidden="true" />
            Recurring money
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            Keep predictable money visible.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
            Track the next due date for income, bills, savings, investments, and debt
            payments. Recurring items are reminders and never post transactions
            automatically.
          </p>
        </div>
      </section>
      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="surface-shadow rounded-[1.4rem] border bg-card p-5 sm:p-7">
          <h2 className="mb-6 font-display text-2xl font-semibold">
            Add recurring item
          </h2>
          <RecurringEntryForm
            categories={data.categories}
            defaultDate={data.defaultDate}
          />
        </div>
        <div className="rounded-[1.4rem] border bg-card p-5 sm:p-6">
          <h2 className="font-display text-2xl font-semibold">Upcoming schedule</h2>
          {data.items.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No recurring items yet.
            </div>
          ) : (
            <ul className="mt-5 divide-y">
              {data.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <CalendarClock className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs capitalize text-muted-foreground">
                        {item.frequency}
                        {item.customIntervalDays
                          ? ` · every ${item.customIntervalDays} days`
                          : ""}{" "}
                        · due {item.nextDueDate}
                      </p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-semibold">
                      {formatMoney(item.amount, {
                        currency: item.currency,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="mt-1 text-xs capitalize text-muted-foreground">
                      {item.type.replaceAll("_", " ")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
