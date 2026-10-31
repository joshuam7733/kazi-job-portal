import { cn } from "@/lib/utils";

/**
 * Server-rendered single-series charts. One hue (accent), recessive grid, rounded data ends
 * anchored to the baseline, native <title> hover tooltips and a table fallback for screen readers.
 */
export function ColumnChart({
  data,
  label,
  valueLabel,
  height = 180,
  className,
}: {
  data: { label: string; value: number; tick?: string }[];
  label: string;
  valueLabel: string;
  height?: number;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const niceMax = niceCeil(max);
  const width = 640;
  const padL = 32;
  const padB = 22;
  const plotH = height - padB - 8;
  const slot = (width - padL) / Math.max(1, data.length);
  const barW = Math.max(3, Math.min(28, slot - 2)); // ≥2px surface gap between bars
  const ticks = [0, niceMax / 2, niceMax];
  const every = Math.ceil(data.length / 8);

  return (
    <figure className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible" role="img" aria-label={label}>
        {ticks.map((t) => {
          const y = 8 + plotH - (t / niceMax) * plotH;
          return (
            <g key={t}>
              <line x1={padL} x2={width} y1={y} y2={y} stroke="var(--line)" strokeWidth={1} />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={11} fill="var(--muted)" className="tabular">
                {formatTick(t)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / niceMax) * plotH;
          const x = padL + i * slot + (slot - barW) / 2;
          const y = 8 + plotH - h;
          const r = Math.min(4, barW / 2, h);
          return (
            <g key={d.label}>
              {/* Generous invisible hit target for the hover tooltip */}
              <rect x={padL + i * slot} y={8} width={slot} height={plotH} fill="transparent">
                <title>{`${d.label}: ${d.value.toLocaleString("en")} ${valueLabel}`}</title>
              </rect>
              {h > 0 && (
                <path d={roundedTop(x, y, barW, h, r)} fill="var(--accent)" className="pointer-events-none">
                  <title>{`${d.label}: ${d.value.toLocaleString("en")} ${valueLabel}`}</title>
                </path>
              )}
              {(i % every === 0 || i === data.length - 1) && (
                <text x={x + barW / 2} y={height - 6} textAnchor="middle" fontSize={11} fill="var(--muted)">
                  {d.tick ?? d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">
        <table>
          <caption>{label}</caption>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <th scope="row">{d.label}</th>
                <td>
                  {d.value} {valueLabel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}

/** Ranked horizontal bars with the value printed in text ink beside each bar. */
export function BarList({ data, label, className }: { data: { label: string; value: number }[]; label: string; className?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure className={className}>
      <figcaption className="sr-only">{label}</figcaption>
      <ul className="grid gap-2.5">
        {data.map((d) => (
          <li key={d.label} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm" title={`${d.label}: ${d.value.toLocaleString("en")}`}>
            <span className="truncate text-muted">{d.label}</span>
            <span className="h-2.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
              <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(d.value > 0 ? 2 : 0, (d.value / max) * 100)}%` }} />
            </span>
            <span className="w-10 text-right font-semibold tabular">{d.value.toLocaleString("en")}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

function niceCeil(n: number) {
  if (n <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(n));
  const steps = [1, 2, 2.5, 5, 10];
  for (const s of steps) if (s * pow >= n) return s * pow;
  return 10 * pow;
}

function formatTick(n: number) {
  if (n >= 1000) return `${+(n / 1000).toFixed(1)}k`;
  return String(Math.round(n * 10) / 10);
}

/** Buckets dated rows into consecutive days (or weeks) ending today. */
export function bucketByDay(dates: Date[], days: number, now = new Date()) {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(end.getTime() - (days - 1 - i) * 86_400_000);
    return { date: d, value: 0 };
  });
  const start = buckets[0].date.getTime();
  for (const dt of dates) {
    const idx = Math.floor((dt.getTime() - start) / 86_400_000);
    if (idx >= 0 && idx < days) buckets[idx].value++;
  }
  return buckets.map((b) => ({
    label: b.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    tick: b.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    value: b.value,
  }));
}

export function bucketByWeek(dates: Date[], weeks: number, now = new Date()) {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const s = new Date(end.getTime() - (weeks - i) * 7 * 86_400_000 + 1);
    return { start: s, value: 0 };
  });
  for (const dt of dates) {
    const idx = Math.floor((dt.getTime() - buckets[0].start.getTime()) / (7 * 86_400_000));
    if (idx >= 0 && idx < weeks) buckets[idx].value++;
  }
  return buckets.map((b) => ({
    label: `Week of ${b.start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
    tick: b.start.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    value: b.value,
  }));
}
