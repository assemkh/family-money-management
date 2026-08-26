import "server-only";

export type SupabasePerformanceEvent = {
  durationMs: number;
  method: string;
  resource: string;
  status: number;
};

type PerformanceStore = {
  supabase: SupabasePerformanceEvent[];
};

const globalPerformanceStore = globalThis as typeof globalThis & {
  __familyMoneyPerformanceStore?: PerformanceStore;
};

function store() {
  // The global survives module reloads in the local test server. The internal
  // endpoint is disabled unless a server-only trace token is explicitly set.
  globalPerformanceStore.__familyMoneyPerformanceStore ??= { supabase: [] };
  return globalPerformanceStore.__familyMoneyPerformanceStore;
}

export function isPerformanceTraceEnabled() {
  return Boolean(process.env.FMM_PERFORMANCE_TRACE_TOKEN);
}

export function recordSupabasePerformance(event: SupabasePerformanceEvent) {
  if (!isPerformanceTraceEnabled()) return;
  store().supabase.push(event);
}

export function resetPerformanceTrace() {
  store().supabase = [];
}

export function readPerformanceTrace() {
  return {
    // Return a copy so callers cannot mutate the process-wide collector.
    supabase: store().supabase.map((event) => ({ ...event })),
  };
}
