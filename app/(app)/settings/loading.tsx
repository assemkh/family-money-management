export default function SettingsLoading() {
  return (
    <div
      className="space-y-6 motion-safe:animate-pulse sm:space-y-8"
      role="status"
      aria-label="Loading family settings"
    >
      <div className="h-80 rounded-[1.75rem] bg-[hsl(164_28%_12%)]/20 sm:h-72" />
      <div className="h-16 rounded-2xl border bg-card" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-40 rounded-[1.3rem] border bg-card" />
        ))}
      </div>
      <div className="h-[32rem] rounded-[1.45rem] border bg-card" />
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="h-[38rem] rounded-[1.45rem] border bg-card" />
        <div className="h-[38rem] rounded-[1.45rem] border bg-card" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
