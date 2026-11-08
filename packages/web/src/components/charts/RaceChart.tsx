import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import type { ReactNode } from "react";
import { SERIES_FILL, SERIES_STROKE, seriesOf } from "./series.ts";
import { tooltipShift, usePointer } from "./usePointer.ts";
import { useWide } from "./useWide.ts";

export interface RaceLine {
  player: number;
  name: string;
  points: { round: number; left: number; bust: boolean }[];
}

const CHAR = 0.62;

function spread(wanted: number[], gap: number, low: number, high: number) {
  const order = wanted.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < order.length; k++) {
    const prev = order[k - 1] as { y: number };
    const cur = order[k] as { y: number };
    if (cur.y - prev.y < gap) cur.y = prev.y + gap;
  }
  const overflow = (order.at(-1)?.y ?? 0) - high;
  if (overflow > 0) for (const o of order) o.y -= overflow;
  for (const o of order) o.y = Math.max(low, o.y);
  const out = [...wanted];
  for (const o of order) out[o.i] = o.y;
  return out;
}

export function RaceChart(props: {
  lines: readonly RaceLine[];
  start: number;
  label: string;
  tooltip: (round: number) => ReactNode;
}) {
  const { lines, start, label, tooltip } = props;
  const wide = useWide();
  const width = wide ? 620 : 358;
  const height = wide ? 420 : 220;
  const font = wide ? 15 : 12;
  const dot = wide ? 8 : 6;
  const rounds = Math.max(1, ...lines.flatMap((l) => l.points.map((p) => p.round)));
  const nameWidth = Math.max(...lines.map((l) => l.name.length)) * font * 0.75 + 14;
  const top = wide ? 24 : 18;
  const bottom = height - (wide ? 34 : 26);
  const y = scaleLinear().domain([0, start]).range([bottom, top]);
  const ticks = y.ticks(4);
  const left = Math.max(...ticks.map((t) => String(t).length)) * font * CHAR + (wide ? 18 : 12);
  const right = width - Math.min(nameWidth, width * 0.3);
  const x = scaleLinear().domain([0, rounds]).range([left, right]);
  const roundsShown = x.ticks(Math.min(rounds, wide ? 10 : 6)).filter(Number.isInteger);
  const positions = Array.from({ length: rounds + 1 }, (_, r) => x(r));
  const { active, handlers } = usePointer(positions, width);
  const path = line<{ round: number; left: number }>()
    .x((p) => x(p.round))
    .y((p) => y(p.left));
  const ends = spread(
    lines.map((l) => y(l.points.at(-1)?.left ?? start)),
    font * 1.2,
    top,
    bottom,
  );
  const share = active === null ? 0 : x(active) / width;

  return (
    <figure className="border-border bg-panel relative m-0 flex flex-1 flex-col justify-center border border-solid px-0 pt-3 pb-1.5">
      <svg
        {...handlers}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
        className="font-text block h-auto w-full touch-pan-y"
        style={{ fontSize: font }}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={left}
              x2={right}
              y1={y(tick)}
              y2={y(tick)}
              className="stroke-line-soft"
              shapeRendering="crispEdges"
            />
            <text x={left - 8} y={y(tick)} className="fill-muted" textAnchor="end" dy="0.3em">
              {tick}
            </text>
          </g>
        ))}
        {roundsShown.map((r) => (
          <text
            key={r}
            x={x(r)}
            y={height - font * 0.5}
            className="fill-muted"
            textAnchor={r === 0 ? "start" : "middle"}
          >
            {r}
          </text>
        ))}
        {active !== null && (
          <line
            x1={x(active)}
            x2={x(active)}
            y1={top}
            y2={bottom}
            className="stroke-border"
            strokeDasharray="4 4"
            shapeRendering="crispEdges"
          />
        )}
        {lines.map((l) => (
          <path
            key={l.player}
            d={path(l.points) ?? ""}
            className={`fill-none stroke-2 ${seriesOf(SERIES_STROKE, l.player)}`}
          />
        ))}
        {lines.map((l) =>
          l.points.map((p) => {
            const size = p.round === active ? dot * 1.5 : dot;
            return (
              <rect
                key={`${l.player}-${p.round}`}
                x={x(p.round) - size / 2}
                y={y(p.left) - size / 2}
                width={size}
                height={size}
                className={
                  p.bust
                    ? `fill-panel stroke-2 ${seriesOf(SERIES_STROKE, l.player)}`
                    : seriesOf(SERIES_FILL, l.player)
                }
              />
            );
          }),
        )}
        {lines.map((l, i) => {
          const last = l.points.at(-1);
          if (!last) return null;
          return (
            <text
              key={l.player}
              x={x(last.round) + dot + 4}
              y={ends[i]}
              dy="0.35em"
              className="fill-text font-pixel uppercase"
              style={{ fontSize: font * 0.8 }}
            >
              {l.name}
            </text>
          );
        })}
      </svg>
      {active !== null && active > 0 && (
        <div
          role="status"
          className="border-border bg-surface font-text kiosk:text-[18px] text-text pointer-events-none absolute top-1 flex flex-col gap-1 border border-solid px-2.5 py-1.5 text-[16px] whitespace-nowrap"
          style={{ left: `${share * 100}%`, transform: tooltipShift(share) }}
        >
          {tooltip(active)}
        </div>
      )}
    </figure>
  );
}
