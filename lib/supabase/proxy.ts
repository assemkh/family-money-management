import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getAuthRedirect } from "@/lib/auth/access";
import { getPublicEnvironment, hasSupabaseEnvironment } from "@/lib/env/public";

function redirectWithSession(
  request: NextRequest,
  sourceResponse: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const response = NextResponse.redirect(url);
  sourceResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));

  ["cache-control", "expires", "pragma"].forEach((header) => {
    const value = sourceResponse.headers.get(header);
    if (value) response.headers.set(header, value);
  });

  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  if (!hasSupabaseEnvironment()) {
    const redirectPath = getAuthRedirect(pathname, false);

    if (redirectPath) {
      return redirectWithSession(request, supabaseResponse, redirectPath);
    }

    return supabaseResponse;
  }

  const environment = getPublicEnvironment();
  const supabase = createServerClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([name, value]) =>
            supabaseResponse.headers.set(name, value),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);
  const redirectPath = getAuthRedirect(pathname, isAuthenticated);

  if (redirectPath) {
    return redirectWithSession(request, supabaseResponse, redirectPath);
  }

  return supabaseResponse;
}
