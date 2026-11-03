import { describe, expect, it } from "vitest";
import { tickLabelWidth, valueScale } from "./chartScale.ts";

describe("value scale", () => {
  it("keeps to at most 5 lines over a wide range", () => {
    const scale = valueScale([45.2, 160.4, 120]);
    expect(scale.ticks.length).toBeLessThanOrEqual(5);
    expect(scale.low).toBeLessThanOrEqual(45.2);
    expect(scale.high).toBeGreaterThanOrEqual(160.4);
  });

  it("is at least 3 steps tall for close values", () => {
    expect(valueScale([60, 62]).ticks).toEqual([55, 60, 65, 70]);
  });

  it("never goes below zero", () => {
    expect(valueScale([1, 2]).low).toBe(0);
  });

  it("measures the widest label", () => {
    expect(tickLabelWidth(valueScale([45, 160]), 10)).toBeCloseTo(3 * 6.2);
  });
});
