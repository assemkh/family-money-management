type CsvValue = string | number | null | undefined;

export function escapeCsvCell(value: CsvValue) {
  const raw = value === null || value === undefined ? "" : String(value);
  const spreadsheetSafe = /^\s*[=+@-]/.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(spreadsheetSafe)
    ? `"${spreadsheetSafe.replaceAll('"', '""')}"`
    : spreadsheetSafe;
}

export function createCsv(headers: string[], rows: CsvValue[][]) {
  const lines = [headers, ...rows].map((row) =>
    row.map((value) => escapeCsvCell(value)).join(","),
  );
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
