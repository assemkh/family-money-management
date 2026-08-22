import { getMessages } from "@/lib/i18n/config";

export default function DashboardLoading() {
  const messages = getMessages();

  return (
    <div className="space-y-8" aria-label={messages.shell.loading}>
      <div className="h-72 animate-pulse rounded-[1.6rem] bg-primary/15" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-56 animate-pulse rounded-[1.35rem] border bg-card"
          />
        ))}
      </div>
    </div>
  );
}
