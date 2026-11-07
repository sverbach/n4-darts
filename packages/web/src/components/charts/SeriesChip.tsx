import { SERIES_BG, seriesOf } from "./series.ts";

export function SeriesChip({ player, className = "" }: { player: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-2.5 flex-none ${seriesOf(SERIES_BG, player)} ${className}`}
    />
  );
}
