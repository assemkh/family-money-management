export function formatMonth(
  value: Date,
  locale = "en-DZ",
  timeZone = "Africa/Algiers",
) {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    timeZone,
    year: "numeric",
  }).format(value);
}

export function formatFullDate(
  value: Date,
  locale = "en-DZ",
  timeZone = "Africa/Algiers",
) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone,
    weekday: "long",
    year: "numeric",
  }).format(value);
}
