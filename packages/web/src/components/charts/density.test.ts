import { describe, expect, it } from "vitest";
import { densityBands, HEAT_STEPS, type Point } from "./density.ts";

function spread(count: number, at: Point, radius: number, seed: number): Point[] {
  let s = seed;
  const random = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return Array.from({ length: count }, () => {
    const r = radius * Math.sqrt(random());
    const a = 2 * Math.PI * random();
    return { x: at.x + r * Math.cos(a), y: at.y + r * Math.sin(a) };
  });
}

const centre = (path: string) => {
  const numbers = [...path.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [
    Number(m[1]),
    Number(m[2]),
  ]);
  const xs = numbers.map(([x]) => x as number);
  const ys = numbers.map(([, y]) => y as number);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
};

describe("densityBands", () => {
  const t20 = { x: 0, y: 0.6 };
  const darts = [...spread(300, t20, 0.06, 7), ...spread(100, { x: 0, y: 0 }, 0.9, 11)];

  it("draws a band per heat step", () => {
    expect(densityBands(darts).map((b) => b.step)).toEqual(
      Array.from({ length: HEAT_STEPS }, (_, i) => i + 1),
    );
  });

  it("puts the hottest band where most darts are, in SVG coordinates (y down)", () => {
    const hottest = densityBands(darts).at(-1);
    const at = centre(hottest?.path ?? "");

    expect(at.x).toBeCloseTo(0, 1);
    expect(at.y).toBeCloseTo(-0.6, 1);
  });

  it("draws nothing without darts", () => {
    expect(densityBands([])).toEqual([]);
  });
});
