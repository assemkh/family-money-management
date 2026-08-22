export type AppErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "CONFIGURATION_ERROR"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "UNKNOWN_ERROR"
  | "VALIDATION_ERROR";

type AppErrorOptions = {
  cause?: unknown;
  context?: Record<string, unknown>;
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly context?: Record<string, unknown>;

  constructor(code: AppErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.context = options.context;
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError("UNKNOWN_ERROR", "Something went wrong. Please try again.", {
    cause: error,
  });
}

export function getSafeErrorMessage(error: unknown) {
  return toAppError(error).message;
}
