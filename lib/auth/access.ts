const publicRoutes = new Set([
  "/",
  "/api/health",
  "/forgot-password",
  "/login",
  "/opengraph-image",
  "/robots.txt",
]);

export function isPublicRoute(pathname: string) {
  return publicRoutes.has(pathname) || pathname.startsWith("/auth/");
}

export function getAuthRedirect(
  pathname: string,
  isAuthenticated: boolean,
): "/dashboard" | "/login" | null {
  if (!isAuthenticated && !isPublicRoute(pathname)) {
    return "/login";
  }

  return null;
}
