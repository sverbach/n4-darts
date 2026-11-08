import { DensityHeatmap } from "../../components/charts/DensityHeatmap.tsx";
import type { Point } from "../../components/charts/density.ts";
import { HeatLegend } from "../../components/charts/HeatLegend.tsx";

const ENOUGH = 30;

export function Heatmap({ points }: { points: Point[] }) {
  if (points.length < ENOUGH) return <p className="hint my-[1em]">Not enough darts yet.</p>;
  return (
    <figure className="border-border bg-panel m-0 flex flex-1 flex-col items-center justify-center gap-3 border border-solid p-3">
      <DensityHeatmap points={points} label={`Where the last ${points.length} darts landed`} />
      <figcaption className="flex flex-col items-center gap-2">
        <HeatLegend low="Fewer" high="More" />
        <span className="label">Last {points.length} darts</span>
      </figcaption>
    </figure>
  );
}
