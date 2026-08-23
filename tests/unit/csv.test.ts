import { describe, expect, it } from "vitest";

import { createCsv, escapeCsvCell } from "@/lib/finance/csv";

describe("CSV export", () => {
  it("quotes commas, line breaks, and quote characters", () => {
    expect(escapeCsvCell('Groceries, "weekly"')).toBe('"Groceries, ""weekly"""');
    expect(escapeCsvCell("line one\nline two")).toBe('"line one\nline two"');
  });

  it.each(["=SUM(A1:A2)", "+1+1", "-2+3", "@COMMAND", "  =1+1"])(
    "neutralizes spreadsheet formula input %s",
    (value) => {
      expect(escapeCsvCell(value)).toBe(`'${value}`);
    },
  );

  it("creates an Excel-friendly UTF-8 document with CRLF rows", () => {
    expect(
      createCsv(
        ["Type", "Amount"],
        [
          ["income", 120000],
          ["expense", 5000],
        ],
      ),
    ).toBe("\uFEFFType,Amount\r\nincome,120000\r\nexpense,5000\r\n");
  });
});
