/** Clockwise from the top, as on the board. */
const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

/** Board Manager's coordinates put the outside of the double ring at about 0.99 (see tools/board-sim). */
const SCALE = 0.99 / 170;
/** Ring edges in board coordinates, from a regulation board's radii in mm. */
const RINGS = {
  bull: 6.35 * SCALE,
  outerBull: 15.9 * SCALE,
  trebleInner: 99 * SCALE,
  trebleOuter: 107 * SCALE,
  doubleInner: 162 * SCALE,
  doubleOuter: 170 * SCALE,
};
const NUMBERS_AT = 1.1;
export const BOARD_SIZE = NUMBERS_AT + 0.1;

export interface Highlight {
  number: number;
  multiplier?: 1 | 2 | 3;
}

/** A point on the board in SVG space: `angle` in degrees, counter-clockwise from 3 o'clock. */
function at(radius: number, angle: number) {
  const a = (angle * Math.PI) / 180;
  return `${(radius * Math.cos(a)).toFixed(4)} ${(-radius * Math.sin(a)).toFixed(4)}`;
}

/** The board's lines between fields, and its fields: singles and rings alternate by segment. */
const LINE = "stroke-bg [stroke-width:0.004]";
const FILL = {
  single: ["fill-surface", "fill-line-soft"],
  ring: ["fill-faint", "fill-border"],
};
const LIT = "fill-accent";

/** The part of segment `index` between two radii. */
function wedge(index: number, inner: number, outer: number) {
  const from = 90 - index * 18 + 9;
  const to = from - 18;
  return [
    `M ${at(outer, from)}`,
    `A ${outer} ${outer} 0 0 1 ${at(outer, to)}`,
    `L ${at(inner, to)}`,
    `A ${inner} ${inner} 0 0 0 ${at(inner, from)}`,
    "Z",
  ].join(" ");
}

const BANDS = [
  { inner: RINGS.outerBull, outer: RINGS.trebleInner, multiplier: 1 },
  { inner: RINGS.trebleInner, outer: RINGS.trebleOuter, multiplier: 3 },
  { inner: RINGS.trebleOuter, outer: RINGS.doubleInner, multiplier: 1 },
  { inner: RINGS.doubleInner, outer: RINGS.doubleOuter, multiplier: 2 },
] as const;

export function BoardFields({ highlight = [] }: { highlight?: readonly Highlight[] }) {
  const lit = (number: number, multiplier: number) =>
    highlight.some(
      (h) => h.number === number && (h.multiplier === undefined || h.multiplier === multiplier),
    );
  const litNumber = (number: number) => highlight.some((h) => h.number === number);
  return (
    <g>
      <circle r={RINGS.doubleOuter} className={`fill-bg ${LINE}`} />
      {ORDER.map((number, i) =>
        BANDS.map(({ inner, outer, multiplier }) => (
          <path
            key={`${number}-${inner}`}
            d={wedge(i, inner, outer)}
            className={`${LINE} ${lit(number, multiplier) ? LIT : FILL[multiplier === 1 ? "single" : "ring"][i % 2]}`}
          />
        )),
      )}
      <circle r={RINGS.outerBull} className={`${lit(25, 1) ? LIT : "fill-border"} ${LINE}`} />
      <circle r={RINGS.bull} className={`${lit(25, 2) ? LIT : "fill-faint"} ${LINE}`} />
      {ORDER.map((number, i) => {
        const [x, y] = at(NUMBERS_AT, 90 - i * 18).split(" ");
        return (
          <text
            key={number}
            x={x}
            y={y}
            className={`font-text text-[0.09px] ${litNumber(number) ? "fill-accent" : "fill-muted"}`}
            textAnchor="middle"
            dy="0.35em"
          >
            {number}
          </text>
        );
      })}
    </g>
  );
}

export function TargetBoard({
  highlight,
  label,
  className = "",
}: {
  highlight: readonly Highlight[];
  label: string;
  className?: string;
}) {
  return (
    <svg
      viewBox={`${-BOARD_SIZE} ${-BOARD_SIZE} ${BOARD_SIZE * 2} ${BOARD_SIZE * 2}`}
      role="img"
      aria-label={label}
      className={`block aspect-square ${className}`}
    >
      <BoardFields highlight={highlight} />
    </svg>
  );
}
