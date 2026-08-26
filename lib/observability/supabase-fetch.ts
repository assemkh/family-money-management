import "server-only";

import {
  isPerformanceTraceEnabled,
  recordSupabasePerformance,
} from "@/lib/observability/performance-store";

function safeResource(input: RequestInfo | URL) {
  try {
    const rawUrl =
      input instanceof Request ? input.url : input instanceof URL ? input.href : input;
    const url = new URL(rawUrl);
    const segments = url.pathname.split("/").filter(Boolean);

    // Query strings can contain user IDs, names, dates, or notes. Recording only
    // the API family and resource keeps the trace useful without retaining data.
    return `/${segments.slice(0, 3).join("/")}`;
  } catch {
    return "/unknown";
  }
}

const tracedSupabaseFetch: typeof fetch = async (input, init) => {
  const startedAt = performance.now();

  try {
    const response = await globalThis.fetch(input, init);
    recordSupabasePerformance({
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      method: init?.method ?? (input instanceof Request ? input.method : "GET"),
      resource: safeResource(input),
      status: response.status,
    });
    return response;
  } catch (error) {
    recordSupabasePerformance({
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      method: init?.method ?? (input instanceof Request ? input.method : "GET"),
      resource: safeResource(input),
      status: 0,
    });
    throw error;
  }
};

export function getSupabaseFetch(): typeof fetch {
  // Avoid even the small timing wrapper in ordinary production requests.
  return isPerformanceTraceEnabled() ? tracedSupabaseFetch : globalThis.fetch;
}
