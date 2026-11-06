// Where a player's darts land: a drawn dartboard with a glowing dot per dart (player-heatmap ticket).

import { BoardFields } from "../../components/Dartboard.tsx";

type Point = { x: number; y: number };

/** Misses further out than this aren't drawn. */
const CUT_OFF = 1.3;
/** Fewer darts than this say too little to show. */
const ENOUGH = 30;

/** The board with the darts on it, or a note when there are too few. */
export function Heatmap({ points }: { points: Point[] }) {
  if (points.length < ENOUGH) return <p className="hint my-[1em]">Not enough darts yet.</p>;
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
        <BoardFields />
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
