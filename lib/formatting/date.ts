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

export function getAlgiersDateValues(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Africa/Algiers",
    year: "numeric",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  const year = part("year");
  const month = part("month");
  const day = part("day");

  return {
    date: `${year}-${month}-${day}`,
    month: `${year}-${month}`,
    monthStart: `${year}-${month}-01`,
  };
}

export function formatShortDate(value: string, locale = "en-DZ") {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "Africa/Algiers",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
}
