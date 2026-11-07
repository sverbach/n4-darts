export const SERIES_BG = [
  "bg-series-1",
  "bg-series-2",
  "bg-series-3",
  "bg-series-4",
  "bg-series-5",
  "bg-series-6",
  "bg-series-7",
  "bg-series-8",
] as const;

export const SERIES_STROKE = [
  "stroke-series-1",
  "stroke-series-2",
  "stroke-series-3",
  "stroke-series-4",
  "stroke-series-5",
  "stroke-series-6",
  "stroke-series-7",
  "stroke-series-8",
] as const;

export const SERIES_FILL = [
  "fill-series-1",
  "fill-series-2",
  "fill-series-3",
  "fill-series-4",
  "fill-series-5",
  "fill-series-6",
  "fill-series-7",
  "fill-series-8",
] as const;

export const seriesOf = <T>(classes: readonly T[], player: number) =>
  classes[player % classes.length] as T;
