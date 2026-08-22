import { hasSupabaseEnvironment } from "@/lib/env/public";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      status: "ok",
      services: {
        application: "ready",
        supabase: hasSupabaseEnvironment() ? "configured" : "unconfigured",
      },
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
