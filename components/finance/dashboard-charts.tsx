import { formatMoney } from "@/lib/formatting/money";
import type {
  DashboardBreakdownItem,
  DashboardPlanRow,
  DashboardTrendPoint,
} from "@/lib/finance/data";

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function compactMonth(month: string) {
  return new Intl.DateTimeFormat("en-DZ", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T12:00:00Z`));
}

export function DashboardTrendChart({ points }: { points: DashboardTrendPoint[] }) {
  const series = [
    { key: "income", label: "Income", color: chartColors[0] },
    { key: "spending", label: "Spending", color: chartColors[1] },
    { key: "savings", label: "Savings", color: chartColors[3] },
    { key: "investments", label: "Investments", color: chartColors[2] },
  ] as const;
  const values = points.flatMap((point) => series.map((item) => point[item.key]));
  const maximum = Math.max(...values, 0);
  const rangeLabel = `${points.length}-month`;

  if (maximum === 0) {
    return (
      <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed bg-muted/20 px-5 text-center">
        <div>
          <p className="font-medium">No {rangeLabel} activity yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Income, expenses, savings, and investments will draw this trend.
          </p>
        </div>
      </div>
    );
  }

  const width = 720;
  const height = 250;
  const horizontalPadding = 28;
  const verticalPadding = 26;
  const chartWidth = width - horizontalPadding * 2;
  const chartHeight = height - verticalPadding * 2;
  const xFor = (index: number) =>
    horizontalPadding +
    (points.length <= 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
  const yFor = (value: number) =>
    verticalPadding + chartHeight - (value / maximum) * chartHeight;

  return (
    <div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
        {series.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            {item.label}
          </span>
        ))}
      </div>
      <div className="mt-5 overflow-x-auto rounded-2xl bg-muted/25 px-2 py-3">
        <svg
          viewBox={`0 0 ${width} ${height + 28}`}
          className="h-auto min-h-56 w-full min-w-[36rem]"
          role="img"
          focusable="false"
          aria-label={`${rangeLabel} trend for income, spending, savings, and investments`}
        >
          {[0, 0.5, 1].map((ratio) => {
            const y = verticalPadding + chartHeight * ratio;
            return (
              <line
                key={ratio}
                x1={horizontalPadding}
                x2={width - horizontalPadding}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeDasharray="4 7"
              />
            );
          })}
          {series.map((item) => (
            <polyline
              key={item.key}
              fill="none"
              points={points
                .map((point, index) => `${xFor(index)},${yFor(point[item.key])}`)
                .join(" ")}
              stroke={item.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {points.map((point, index) => (
            <g key={point.month}>
              <text
                x={xFor(index)}
                y={height + 18}
                textAnchor="middle"
                className="fill-muted-foreground text-[12px] font-semibold"
              >
                {compactMonth(point.month)}
              </text>
              <circle
                cx={xFor(index)}
                cy={yFor(point.income)}
                r="4"
                fill={chartColors[0]}
                stroke="hsl(var(--card))"
                strokeWidth="3"
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export function DashboardNetWorthTrend({ points }: { points: DashboardTrendPoint[] }) {
  const captured = points.filter(
    (point): point is DashboardTrendPoint & { netWorth: number } =>
      point.netWorth !== null,
  );

  if (captured.length < 2) {
    return (
      <div className="grid min-h-44 place-items-center rounded-2xl border border-dashed bg-muted/20 px-5 text-center">
        <div>
          <p className="font-medium">Capture two monthly snapshots.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Net-worth direction needs stable historical values.
          </p>
        </div>
      </div>
    );
  }

  const width = 520;
  const height = 150;
  const minimum = Math.min(...captured.map((point) => point.netWorth));
  const maximum = Math.max(...captured.map((point) => point.netWorth));
  const range = Math.max(maximum - minimum, Math.abs(maximum) * 0.08, 1);
  const xFor = (index: number) => 18 + (index / (captured.length - 1)) * (width - 36);
  const yFor = (value: number) => 16 + (1 - (value - minimum) / range) * (height - 36);
  const linePoints = captured
    .map((point, index) => `${xFor(index)},${yFor(point.netWorth)}`)
    .join(" ");
  const areaPoints = `18,${height} ${linePoints} ${width - 18},${height}`;
  const change = captured.at(-1)!.netWorth - captured[0].netWorth;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Captured period change</p>
          <p
            className={`mt-1 font-display text-2xl font-semibold tabular-nums ${change >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}
          >
            {change >= 0 ? "+" : ""}
            {formatMoney(change, { compact: true, maximumFractionDigits: 1 })}
          </p>
        </div>
        <p className="text-end text-xs text-muted-foreground">
          {compactMonth(captured[0].month)} → {compactMonth(captured.at(-1)!.month)}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-4 h-auto w-full"
        role="img"
        focusable="false"
        aria-label={`Net worth changed by ${formatMoney(change)} across captured months`}
      >
        <defs>
          <linearGradient id="netWorthArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity="0.24" />
            <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#netWorthArea)" />
        <polyline
          points={linePoints}
          fill="none"
          stroke="hsl(var(--chart-1))"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
          vectorEffect="non-scaling-stroke"
        />
        {captured.map((point, index) => (
          <circle
            key={point.month}
            cx={xFor(index)}
            cy={yFor(point.netWorth)}
            r="4"
            fill="hsl(var(--chart-1))"
            stroke="hsl(var(--card))"
            strokeWidth="3"
          />
        ))}
      </svg>
    </div>
  );
}

export function DashboardDonut({
  items,
  total,
  totalLabel,
}: {
  items: DashboardBreakdownItem[];
  total: number;
  totalLabel: string;
}) {
  if (items.length === 0 || total <= 0) {
    return (
      <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed bg-muted/20 px-5 text-center">
        <div>
          <p className="font-medium">Nothing to distribute yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This chart appears when source records are available.
          </p>
        </div>
      </div>
    );
  }

  const slices = items.reduce<{ end: number; values: string[] }>(
    (result, item, index) => {
      const end = result.end + item.percentage;
      return {
        end,
        values: [
          ...result.values,
          `${chartColors[index % chartColors.length]} ${result.end}% ${end}%`,
        ],
      };
    },
    { end: 0, values: [] },
  ).values;

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[11rem_1fr]">
      <div
        className="relative mx-auto grid size-44 place-items-center rounded-full"
        style={{ background: `conic-gradient(${slices.join(", ")})` }}
        role="img"
        aria-label={`${totalLabel}: ${items.map((item) => `${item.label} ${item.percentage.toFixed(0)} percent`).join(", ")}`}
      >
        <div className="grid size-28 place-items-center rounded-full border bg-card text-center shadow-sm">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {totalLabel}
            </p>
            <p className="mt-1 font-display text-lg font-semibold tabular-nums">
              {formatMoney(total, { compact: true, maximumFractionDigits: 1 })}
            </p>
          </div>
        </div>
      </div>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={item.key}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="inline-flex min-w-0 items-center gap-2.5 font-medium">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: chartColors[index % chartColors.length] }}
              />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 text-end tabular-nums text-muted-foreground">
              {item.percentage.toFixed(0)}% ·{" "}
              {formatMoney(item.amount, { compact: true })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DashboardPlanActual({ rows }: { rows: DashboardPlanRow[] }) {
  if (rows.every((row) => row.planned === null)) {
    return (
      <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed bg-muted/20 px-5 text-center">
        <div>
          <p className="font-medium">No active plan for this month.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a monthly plan to compare intentions with source records.
          </p>
        </div>
      </div>
    );
  }

  const maximum = Math.max(...rows.flatMap((row) => [row.actual, row.planned ?? 0]), 1);

  return (
    <div className="space-y-5">
      <div className="flex gap-5 text-xs font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-5 rounded-full bg-primary" /> Planned
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-5 rounded-full bg-accent" /> Actual
        </span>
      </div>
      {rows.map((row) => (
        <div key={row.key}>
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold">{row.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {formatMoney(row.planned ?? 0, { compact: true })} /{" "}
              {formatMoney(row.actual, { compact: true })}
            </span>
          </div>
          <div
            className="space-y-1.5"
            aria-label={`${row.label} planned versus actual`}
          >
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${((row.planned ?? 0) / maximum) * 100}%` }}
              />
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${(row.actual / maximum) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
