export default function DashboardLoading() {
  return (
    <div
      className="space-y-6 motion-safe:animate-pulse sm:space-y-8"
      role="status"
      aria-label="Loading family financial brief"
    >
      <div className="h-[23rem] rounded-[1.75rem] bg-[hsl(164_28%_12%)]/20 sm:h-80" />
      <div>
        <div className="h-3 w-28 rounded-full bg-muted" />
        <div className="mt-3 h-8 w-64 max-w-full rounded-lg bg-muted" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-44 rounded-[1.25rem] border bg-card p-5">
              <div className="size-9 rounded-xl bg-muted" />
              <div className="mt-7 h-3 w-20 rounded bg-muted" />
              <div className="mt-3 h-7 w-28 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-12">
        <div className="h-[28rem] rounded-[1.4rem] border bg-card xl:col-span-8" />
        <div className="h-[28rem] rounded-[1.4rem] border bg-card xl:col-span-4" />
        <div className="h-80 rounded-[1.4rem] border bg-card xl:col-span-5" />
        <div className="h-80 rounded-[1.4rem] border bg-card xl:col-span-7" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
