import { describe, expect, it } from "vitest";
import { dayScale, nearestIndex, thinLabels, valueScale } from "./scales.ts";

describe("nearestIndex", () => {
  it("finds the closest position", () => {
    expect(nearestIndex([0, 10, 40], 26)).toBe(2);
    expect(nearestIndex([0, 10, 40], 24)).toBe(1);
    expect(nearestIndex([0, 10, 40], -5)).toBe(0);
  });

  it("is -1 without positions", () => {
    expect(nearestIndex([], 3)).toBe(-1);
  });
});

describe("thinLabels", () => {
  it("keeps every label that fits", () => {
    expect(thinLabels([0, 100, 200], [40, 40, 40], 8)).toEqual([0, 1, 2]);
  });

  it("drops labels that would overlap, keeping the first", () => {
    expect(thinLabels([0, 30, 60, 90, 120], [40, 40, 40, 40, 40], 8)).toEqual([0, 2, 4]);
  });

  it("always keeps the last, dropping the one before it if they'd overlap", () => {
    expect(thinLabels([0, 50, 100, 110], [40, 40, 40, 40], 8)).toEqual([0, 1, 3]);
  });
});

describe("scales", () => {
  it("puts round numbers at the ends of the value axis", () => {
    expect(valueScale([37.2, 52.9], [100, 0]).domain()).toEqual([35, 55]);
  });

  it("gives a single value some room", () => {
    const [low, high] = valueScale([40, 40], [100, 0]).domain();
    expect(low).toBeLessThan(40);
    expect(high).toBeGreaterThan(40);
  });

  it("spaces days by time, not by count", () => {
    const days = ["2026-11-01", "2026-11-02", "2026-11-11"].map((d) => new Date(`${d}T00:00:00Z`));
    const x = dayScale(days, [0, 100]);
    expect(days.map((d) => Math.round(x(d)))).toEqual([0, 10, 100]);
  });
});
