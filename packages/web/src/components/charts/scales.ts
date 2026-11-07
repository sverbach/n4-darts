import { leastIndex } from "d3-array";
import { type ScaleLinear, type ScaleTime, scaleLinear, scaleUtc } from "d3-scale";

export function valueScale(values: number[], range: [number, number]): ScaleLinear<number, number> {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const domain: [number, number] = low === high ? [low - 5, high + 5] : [low, high];
  return scaleLinear().domain(domain).nice(4).range(range);
}

export function dayScale(days: Date[], range: [number, number]): ScaleTime<number, number> {
  const first = days[0] ?? new Date(0);
  const last = days.at(-1) ?? first;
  return scaleUtc().domain([first, last]).range(range);
}

export const dayDate = (day: string) => new Date(`${day}T00:00:00Z`);

export function nearestIndex(positions: readonly number[], at: number): number {
  return leastIndex(positions, (p) => Math.abs(p - at)) ?? -1;
}

export function thinLabels(positions: readonly number[], widths: readonly number[], gap: number) {
  const kept: number[] = [];
  const fits = (a: number, b: number) =>
    Math.abs((positions[b] ?? 0) - (positions[a] ?? 0)) >=
    ((widths[a] ?? 0) + (widths[b] ?? 0)) / 2 + gap;
  for (let i = 0; i < positions.length; i++) {
    const previous = kept.at(-1);
    if (previous === undefined || fits(previous, i)) kept.push(i);
  }
  const last = positions.length - 1;
  if (last >= 0 && kept.at(-1) !== last) {
    while (kept.length > 0 && !fits(kept.at(-1) as number, last)) kept.pop();
    kept.push(last);
  }
  return kept;
}
