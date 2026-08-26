import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import {
  readPerformanceTrace,
  resetPerformanceTrace,
} from "@/lib/observability/performance-store";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const expected = process.env.FMM_PERFORMANCE_TRACE_TOKEN;
  const received = request.headers.get("x-performance-trace-token");
  if (!expected || !received) return false;

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function unavailable() {
  // Returning 404 keeps this local-only diagnostic surface undiscoverable when
  // the server-only trace token is absent or incorrect.
  return new NextResponse(null, { status: 404 });
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unavailable();
  return NextResponse.json(readPerformanceTrace(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) return unavailable();
  resetPerformanceTrace();
  return new NextResponse(null, { status: 204 });
}
