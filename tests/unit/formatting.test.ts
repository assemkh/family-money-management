import { describe, expect, it } from "vitest";

import { formatFullDate, formatMonth } from "@/lib/formatting/date";
import { formatMoney } from "@/lib/formatting/money";

describe("money formatting", () => {
  it("formats detailed DZD values with the family-facing label", () => {
    expect(formatMoney(320_000, { locale: "en-US" })).toBe("320,000 DA");
  });

  it("formats compact values without floating-point noise", () => {
    expect(formatMoney(320_000, { compact: true, locale: "en-US" })).toBe("320K DA");
    expect(formatMoney(-0, { locale: "en-US" })).toBe("0 DA");
  });

  it("does not render invalid numeric values", () => {
    expect(formatMoney(Number.NaN)).toBe("—");
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("date formatting", () => {
  const date = new Date("2026-08-22T12:00:00.000Z");

  it("formats a month in the configured family timezone", () => {
    expect(formatMonth(date, "en-US")).toBe("August 2026");
  });

  it("formats a complete family-facing date", () => {
    expect(formatFullDate(date, "en-US")).toBe("Saturday, August 22, 2026");
  });
});
