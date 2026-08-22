export default function FinanceWorkspaceLoading() {
  return (
    <div
      className="space-y-6 motion-safe:animate-pulse sm:space-y-8"
      role="status"
      aria-label="Loading financial workspace"
    >
      <div className="h-56 rounded-[1.6rem] bg-primary/12 sm:h-64" />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="rounded-[1.4rem] border bg-card p-5 sm:p-7">
          <div className="h-3 w-24 rounded-full bg-muted" />
          <div className="mt-4 h-8 w-56 max-w-full rounded-lg bg-muted" />
          <div className="mt-3 h-4 w-full max-w-md rounded bg-muted" />
          <div className="mt-8 h-16 rounded-2xl bg-muted" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="h-12 rounded-xl bg-muted" />
            <div className="h-12 rounded-xl bg-muted" />
          </div>
          <div className="mt-6 h-12 rounded-xl bg-muted" />
        </div>
        <div className="rounded-[1.4rem] border bg-card p-5 sm:p-6">
          <div className="h-7 w-44 rounded-lg bg-muted" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-36 rounded bg-muted" />
                  <div className="mt-2 h-3 w-24 rounded bg-muted" />
                </div>
                <div className="h-4 w-24 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
