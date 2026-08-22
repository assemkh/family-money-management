import { describe, expect, it } from "vitest";

import {
  currencyCodeSchema,
  monthKeySchema,
  positiveMoneyAmountSchema,
  usernameSchema,
} from "@/lib/validation/common";

describe("foundation validation", () => {
  it("accepts normalized currencies and month keys", () => {
    expect(currencyCodeSchema.parse("DZD")).toBe("DZD");
    expect(monthKeySchema.parse("2026-08-01")).toBe("2026-08-01");
  });

  it("rejects invalid money amounts and month keys", () => {
    expect(positiveMoneyAmountSchema.safeParse(0).success).toBe(false);
    expect(positiveMoneyAmountSchema.safeParse(-10).success).toBe(false);
    expect(monthKeySchema.safeParse("2026-08-22").success).toBe(false);
  });

  it("keeps usernames compatible with the planned username login", () => {
    expect(usernameSchema.parse("assemkh")).toBe("assemkh");
    expect(usernameSchema.safeParse("invalid username").success).toBe(false);
  });
});
