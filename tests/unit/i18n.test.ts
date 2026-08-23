import { describe, expect, it } from "vitest";

import { getDirection, getMessages } from "@/lib/i18n/config";
import { getSettingsCopy } from "@/lib/i18n/settings-copy";

describe("localization", () => {
  it("uses the correct document direction for supported locales", () => {
    expect(getDirection("en")).toBe("ltr");
    expect(getDirection("ar")).toBe("rtl");
  });

  it("provides localized shell navigation and security actions", () => {
    const english = getMessages("en");
    const arabic = getMessages("ar");

    expect(english.navigation.assets).toBe("Assets & gold");
    expect(arabic.navigation.assets).toBe("الأصول والذهب");
    expect(english.shell.signOutEverywhere).toBe("Sign out everywhere");
    expect(arabic.shell.signOutEverywhere).toBe("تسجيل الخروج من كل الأجهزة");
  });

  it("provides English Settings copy and dynamic inventory totals", () => {
    const copy = getSettingsCopy("en");

    expect(copy.hero.title).toBe("Shape the system around your family.");
    expect(copy.inventory.configuredCategories(6)).toBe("6 family-configured in total");
  });

  it("provides Arabic Settings copy and dynamic inventory totals", () => {
    const copy = getSettingsCopy("ar");

    expect(copy.hero.title).toBe("اضبط النظام بما يناسب عائلتك.");
    expect(copy.inventory.configuredCategories(6)).toBe(
      "6 تصنيفاً خاصاً بالعائلة إجمالاً",
    );
    expect(copy.allocationForm.fields.investment).toBe("الاستثمارات");
    expect(copy.dashboardForm.widgets.showGoals.label).toBe("أهداف الادخار");
    expect(copy.securityControls.revokeOthers).toBe("إلغاء الجلسات الأخرى");
  });
});
