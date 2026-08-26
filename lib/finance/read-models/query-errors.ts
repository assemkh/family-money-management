import "server-only";

/**
 * Read models fan out with `Promise.all`. This turns the first failed result into one
 * neutral, household-data-free message, so a partial fan-out can never be rendered as
 * if it were complete.
 */
export function ensureNoQueryErrors(
  results: Array<{ error: { message: string } | null }>,
  message: string,
) {
  if (results.some((result) => result.error)) throw new Error(message);
}
