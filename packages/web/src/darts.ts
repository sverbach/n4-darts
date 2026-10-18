import type { Segment } from "@n4/engine";

/** Short label for a dart: `T20`, `D16`, `S5`, `25`, `Bull`, `Miss`. */
export function dartLabel(segment: Segment): string {
  if (segment.multiplier === 0) return "Miss";
  if (segment.number === 25) return segment.multiplier === 2 ? "Bull" : "25";
  return `${["", "S", "D", "T"][segment.multiplier]}${segment.number}`;
}
