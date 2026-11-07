import { type ContourDensity, type ContourMultiPolygon, contourDensity } from "d3-contour";

export type Point = { x: number; y: number };

export const HEAT_STEPS = 7;
const LEVELS = [0.04, 0.1, 0.2, 0.33, 0.5, 0.68, 0.86];
const EXTENT = 1.3;
const PIXELS = 200;
const BANDWIDTH = 0.055;

type Contours = ((threshold: number) => ContourMultiPolygon) & { readonly max: number };
type WithContours = ContourDensity<Point> & { contours(data: Point[]): Contours };

export interface Band {
  step: number;
  path: string;
}

function ringPath(ring: number[][]) {
  const toBoard = ([x, y]: number[]) =>
    `${((x ?? 0) / PIXELS - EXTENT).toFixed(4)},${((y ?? 0) / PIXELS - EXTENT).toFixed(4)}`;
  return `M${ring.map(toBoard).join("L")}Z`;
}

export function densityBands(points: readonly Point[]): Band[] {
  if (points.length === 0) return [];
  const size = Math.round(2 * EXTENT * PIXELS);
  const estimate = contourDensity<Point>()
    .x((p) => (p.x + EXTENT) * PIXELS)
    .y((p) => (EXTENT - p.y) * PIXELS)
    .size([size, size])
    .cellSize(2)
    .bandwidth(BANDWIDTH * PIXELS) as WithContours;
  const density = estimate.contours([...points]);
  return LEVELS.map((level, i) => ({
    step: i + 1,
    path: density(level * density.max)
      .coordinates.flatMap((polygon) => polygon.map(ringPath))
      .join(""),
  })).filter((band) => band.path.length > 0);
}
