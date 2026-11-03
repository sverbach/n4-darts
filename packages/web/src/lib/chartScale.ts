const STEPS = [5, 10, 20, 25, 50, 100];

export interface ValueScale {
  low: number;
  high: number;
  ticks: number[];
}

/** A value axis at a round step around `values`: 4 to 5 lines, at least 3 steps tall. */
export function valueScale(values: number[]): ValueScale {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = (s: number) => Math.ceil(max / s) * s - Math.floor(min / s) * s;
  const step = STEPS.find((s) => span(s) <= 4 * s) ?? (STEPS.at(-1) as number);
  let low = Math.floor(min / step) * step;
  let high = Math.ceil(max / step) * step;
  if (high - low < 3 * step) {
    low = Math.max(0, low - step);
    high = low + 3 * step;
  }
  const ticks = Array.from({ length: (high - low) / step + 1 }, (_, i) => low + i * step);
  return { low, high, ticks };
}

/** The width the widest tick label takes at `font` size, in the same units. */
export const tickLabelWidth = (scale: ValueScale, font: number) =>
  Math.max(...scale.ticks.map((t) => String(t).length)) * font * 0.62;
