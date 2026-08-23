export default function ReportsLoading() {
  return (
    <div
      className="space-y-6 motion-safe:animate-pulse sm:space-y-8"
      role="status"
      aria-label="Loading financial reports"
    >
      <div className="h-72 rounded-[1.6rem] bg-primary/15" />
      <div className="rounded-[1.35rem] border bg-card p-5">
        <div className="h-6 w-44 rounded bg-muted" />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-12 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-40 rounded-[1.25rem] border bg-card" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="h-96 rounded-[1.4rem] border bg-card" />
        <div className="h-96 rounded-[1.4rem] border bg-card" />
      </div>
      <div className="h-[30rem] rounded-[1.4rem] border bg-card" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
