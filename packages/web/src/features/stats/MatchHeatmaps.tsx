import type { MatchPage } from "@n4/server/api";
import { DensityHeatmap } from "../../components/charts/DensityHeatmap.tsx";
import { HeatLegend } from "../../components/charts/HeatLegend.tsx";
import { SeriesChip } from "../../components/charts/SeriesChip.tsx";

const ENOUGH = 9;

export const hasHeatmaps = (match: MatchPage) => match.landed.some((d) => d.length >= ENOUGH);

export function MatchHeatmaps({ match }: { match: MatchPage }) {
  return (
    <div className="flex flex-col items-center gap-3 border border-border border-solid bg-panel kiosk:p-5 p-3">
      <ul className="m-0 grid w-full list-none grid-cols-2 kiosk:grid-cols-[repeat(auto-fit,minmax(220px,320px))] kiosk:justify-center gap-4 kiosk:gap-8 p-0">
        {match.players.map((p, i) => {
          const darts = match.landed[i] ?? [];
          return (
            <li key={p.id} className="flex min-w-0 flex-col items-center gap-2">
              <span className="flex max-w-full items-baseline gap-2">
                <SeriesChip player={i} />
                <span className="label break-words text-text">{p.name}</span>
              </span>
              {darts.length < ENOUGH ? (
                <p className="hint m-0 flex aspect-square w-full items-center justify-center text-center">
                  Too few darts
                </p>
              ) : (
                <DensityHeatmap
                  points={darts}
                  label={`Where ${p.name}'s ${darts.length} darts landed`}
                  className=""
                />
              )}
              <span className="label">
                {darts.length} {darts.length === 1 ? "dart" : "darts"}
              </span>
            </li>
          );
        })}
      </ul>
      <HeatLegend low="Fewer" high="More" />
    </div>
  );
}
