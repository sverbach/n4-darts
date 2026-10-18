// Pure game rules. No runtime dependencies, no I/O (see docs/adr/0006).

/** Points scored by a single dart: the Board Manager reports bed number and multiplier. */
export function dartScore(segment: { number: number; multiplier: number }): number {
  return segment.number * segment.multiplier;
}
