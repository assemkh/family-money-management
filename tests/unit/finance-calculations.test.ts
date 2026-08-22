import { describe, expect, it } from "vitest";

import {
  calculateGain,
  calculateLiabilityRemaining,
  convertToDzd,
} from "@/lib/finance/calculations";

describe("finance calculations", () => {
  it("keeps DZD values unchanged", () => {
    expect(convertToDzd(320000, "DZD", {})).toBe(320000);
  });

  it("converts foreign currency using only manual rates", () => {
    expect(convertToDzd(100, "EUR", { EUR: 250 })).toBe(25000);
    expect(convertToDzd(50, "USD", { USD: 220 })).toBe(11000);
  });

  it("does not invent a conversion when a rate is missing", () => {
    expect(convertToDzd(100, "EUR", {})).toBeNull();
  });

  it("calculates gold and investment gain with zero protection", () => {
    expect(calculateGain(150000, 100000)).toEqual({
      gain: 50000,
      returnPercentage: 50,
    });
    expect(calculateGain(100, 0)).toEqual({ gain: 100, returnPercentage: null });
  });

  it("calculates remaining liability without going below zero", () => {
    expect(calculateLiabilityRemaining(100000, 25000)).toBe(75000);
    expect(calculateLiabilityRemaining(100000, 120000)).toBe(0);
  });
});
