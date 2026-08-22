import { describe, expect, it } from "vitest";

import { AppError, getSafeErrorMessage, toAppError } from "@/lib/errors/app-error";

describe("safe application errors", () => {
  it("preserves intentional user-safe errors", () => {
    const error = new AppError("VALIDATION_ERROR", "Check the amount.");

    expect(toAppError(error)).toBe(error);
    expect(getSafeErrorMessage(error)).toBe("Check the amount.");
  });

  it("does not expose unexpected technical errors", () => {
    const error = new Error("database password leaked in stack");

    expect(getSafeErrorMessage(error)).toBe("Something went wrong. Please try again.");
  });
});
