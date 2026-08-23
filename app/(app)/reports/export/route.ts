import type { NextRequest } from "next/server";

import { createCsv } from "@/lib/finance/csv";
import { getReportActivityExportData } from "@/lib/finance/data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  try {
    const data = await getReportActivityExportData({
      month: params.get("month") ?? undefined,
      year: params.get("year") ?? undefined,
      period: params.get("period") ?? undefined,
      activityType: params.get("activityType") ?? undefined,
      memberId: params.get("memberId") ?? undefined,
    });

    if (!data) {
      return new Response("Authentication required.", {
        status: 401,
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const csv = createCsv(
      ["Date", "Month", "Type", "Category", "Member", "Amount", "Currency", "Note"],
      data.rows.map((row) => [
        row.date,
        row.month,
        row.type,
        row.category,
        row.memberName,
        row.amount.toFixed(2),
        row.currency,
        row.note,
      ]),
    );
    const periodLabel =
      data.filters.period === "month" ? data.selectedMonth : data.selectedYear;
    const filename = `family-money-${periodLabel}-${data.filters.activityType}.csv`;

    return new Response(csv, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("The report export could not be created.", {
      status: 500,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}
