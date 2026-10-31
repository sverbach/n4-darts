// Where a player's darts land: a drawn dartboard with a glowing dot per dart (player-heatmap ticket).

type Point = { x: number; y: number };

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
/** Misses further out than this aren't drawn. */
const CUT_OFF = 1.3;
/** Fewer darts than this say too little to show. */
const ENOUGH = 30;

/** A point on the board in SVG space: `angle` in degrees, counter-clockwise from 3 o'clock. */
function at(radius: number, angle: number) {
  const a = (angle * Math.PI) / 180;
  return `${(radius * Math.cos(a)).toFixed(4)} ${(-radius * Math.sin(a)).toFixed(4)}`;
}

/** The board's lines between fields, and its fields: singles and rings alternate by segment. */
const LINE = "stroke-bg [stroke-width:0.004]";
const FILL = {
  single: ["fill-surface", "fill-line-soft"],
  ring: ["fill-accent-line", "fill-border"],
};

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

function Board() {
  const bands = [
    { inner: RINGS.outerBull, outer: RINGS.trebleInner, ring: false },
    { inner: RINGS.trebleInner, outer: RINGS.trebleOuter, ring: true },
    { inner: RINGS.trebleOuter, outer: RINGS.doubleInner, ring: false },
    { inner: RINGS.doubleInner, outer: RINGS.doubleOuter, ring: true },
  ];
  return (
    <g>
      <circle r={RINGS.doubleOuter} className={`fill-bg ${LINE}`} />
      {ORDER.map((number, i) =>
        bands.map(({ inner, outer, ring }) => (
          <path
            key={`${number}-${inner}`}
            d={wedge(i, inner, outer)}
            className={`${LINE} ${FILL[ring ? "ring" : "single"][i % 2]}`}
          />
        )),
      )}
      <circle r={RINGS.outerBull} className={`fill-border ${LINE}`} />
      <circle r={RINGS.bull} className={`fill-accent-line ${LINE}`} />
      {ORDER.map((number, i) => {
        const [x, y] = at(NUMBERS_AT, 90 - i * 18).split(" ");
        return (
          <text
            key={number}
            x={x}
            y={y}
            className="fill-muted font-text text-[0.09px]"
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

/** The board with the darts on it, or a note when there are too few. */
export function Heatmap({ points }: { points: Point[] }) {
  if (points.length < ENOUGH) return <p className="hint my-[1em]">Not enough darts yet</p>;
  const shown = points.filter((p) => Math.hypot(p.x, p.y) <= CUT_OFF);
  const size = CUT_OFF + 0.05;
  return (
    <figure className="m-0 flex flex-col items-center gap-2 border border-border border-solid bg-panel p-3">
      <svg
        viewBox={`${-size} ${-size} ${size * 2} ${size * 2}`}
        role="img"
        aria-label={`Where the last ${points.length} darts landed`}
        className="block h-auto w-full max-w-[420px]"
      >
        <defs>
          <filter id="heat-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.045" />
          </filter>
        </defs>
        <Board />
        <g filter="url(#heat-blur)">
          {shown.map((p, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: darts are just positions; two can share one.
            <circle key={i} cx={p.x} cy={-p.y} r={0.07} className="fill-warn opacity-35" />
          ))}
        </g>
        <g>
          {shown.map((p, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: as above.
            <circle key={i} cx={p.x} cy={-p.y} r={0.007} className="fill-text opacity-70" />
          ))}
        </g>
      </svg>
      <figcaption className="label">Last {points.length} darts</figcaption>
    </figure>
  );
}
