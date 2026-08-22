import { messages as arMessages } from "@/lib/i18n/messages/ar";
import { messages as enMessages } from "@/lib/i18n/messages/en";
import type { Messages } from "@/lib/i18n/types";

export const supportedLocales = ["en", "ar"] as const;
export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";

const dictionaries: Record<Locale, Messages> = {
  ar: arMessages,
  en: enMessages,
};

export function getMessages(locale: Locale = defaultLocale) {
  return dictionaries[locale];
}

export function getDirection(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}
