export const rememberSessionCookie = "fmm-remember-session";

export function sessionCookieOptions<
  Options extends { expires?: Date; maxAge?: number },
>(options: Options, rememberSession: boolean) {
  if (rememberSession) return options;

  const sessionOptions = { ...options };
  delete sessionOptions.expires;
  delete sessionOptions.maxAge;
  return sessionOptions;
}
