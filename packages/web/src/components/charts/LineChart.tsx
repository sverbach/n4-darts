import { line } from "d3-shape";
import { dayScale, thinLabels, valueScale } from "./scales.ts";
import { tooltipShift, usePointer } from "./usePointer.ts";
import { useWide } from "./useWide.ts";

export interface LinePoint {
  key: string;
  x: Date;
  y: number;
  axisLabel: string;
  tooltip: string;
}

const CHAR = 0.62;
const LABEL_CHAR = 0.8;

export function LineChart(props: {
  points: readonly LinePoint[];
  label: string;
  format: (value: number) => string;
}) {
  const { points, label, format } = props;
  const wide = useWide();

  const width = wide ? 840 : 358;
  const height = wide ? 300 : 200;
  const font = wide ? 20 : 13;
  const dot = wide ? 10 : 6;
  const y = valueScale(
    points.map((p) => p.y),
    [height - (wide ? 40 : 26), wide ? 48 : 34],
  );
  const ticks = y.ticks(4);
  const labelWidth = Math.max(...ticks.map((t) => String(t).length)) * font * CHAR;
  const left = Math.max(wide ? 60 : 30, labelWidth + (wide ? 20 : 16));
  const right = width - (wide ? 30 : 16);
  const x = dayScale(
    points.map((p) => p.x),
    [left, right],
  );
  const xs = points.map((p) => x(p.x));
  const last = points.length - 1;
  const labelWidths = points.map((p) => p.axisLabel.length * font * LABEL_CHAR);
  const labelCentres = xs.map((at, i) => {
    const half = (labelWidths[i] ?? 0) / 2;
    return i === 0 ? at + half : i === last ? at - half : at;
  });
  const shown = new Set(thinLabels(labelCentres, labelWidths, font));
  const path =
    line<LinePoint>()
      .x((p) => x(p.x))
      .y((p) => y(p.y))(points as LinePoint[]) ?? "";
  const tag = format(points[last]?.y ?? 0);
  const tagWidth = tag.length * font * 0.5 + font;
  const tagX = Math.min(width - tagWidth - 4, Math.max(4, (xs[last] ?? 0) - tagWidth / 2));

  const { active, handlers } = usePointer(xs, width);
  const point = active === null ? undefined : points[active];
  const share = active === null ? 0 : (xs[active] ?? 0) / width;

  return (
    <figure className="relative m-0 flex flex-1 flex-col justify-center border border-border border-solid bg-panel px-0 pt-3 pb-1.5">
      <svg
        {...handlers}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
        className="block h-auto w-full touch-pan-y font-text"
        shapeRendering="crispEdges"
        style={{ fontSize: font }}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={left} x2={right} y1={y(tick)} y2={y(tick)} className="stroke-line-soft" />
            <text
              x={left - (wide ? 12 : 8)}
              y={y(tick)}
              className="fill-muted"
              textAnchor="end"
              dy="0.3em"
            >
              {tick}
            </text>
          </g>
        ))}
        {point && (
          <line
            x1={xs[active ?? 0]}
            x2={xs[active ?? 0]}
            y1={y.range()[1]}
            y2={y.range()[0]}
            className="stroke-border"
            strokeDasharray="4 4"
          />
        )}
        <path d={path} className="fill-none stroke-3 stroke-muted" shapeRendering="auto" />
        {points.map((p, i) => {
          const size = i === active ? dot * 1.6 : i === last ? dot * 1.4 : dot;
          return (
            <g key={p.key}>
              <rect
                x={(xs[i] ?? 0) - size / 2}
                y={y(p.y) - size / 2}
                width={size}
                height={size}
                className={i === active ? "fill-accent" : "fill-text"}
              />
              {shown.has(i) && (
                <text
                  x={xs[i]}
                  y={height - font * 0.6}
                  className="fill-muted uppercase"
                  textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
                >
                  {p.axisLabel}
                </text>
              )}
            </g>
          );
        })}
        {!point && (
          <>
            <rect
              x={tagX}
              y={4}
              width={tagWidth}
              height={font * 1.5}
              className="fill-surface stroke-border"
            />
            <text
              x={tagX + tagWidth / 2}
              y={4 + font * 1.1}
              className="fill-text uppercase"
              textAnchor="middle"
            >
              {tag}
            </text>
          </>
        )}
      </svg>
      {point && (
        <div
          role="status"
          className="pointer-events-none absolute top-1 whitespace-nowrap border border-border border-solid bg-surface px-2.5 py-1.5 font-text kiosk:text-[18px] text-[16px] text-text"
          style={{
            left: `${share * 100}%`,
            transform: tooltipShift(share),
          }}
        >
          {point.tooltip}
        </div>
      )}
    </figure>
  );
}
