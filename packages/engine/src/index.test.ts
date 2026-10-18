import { describe, expect, it } from "vitest";
import { dartScore } from "./index.ts";

describe("dartScore", () => {
  it("multiplies number by multiplier", () => {
    expect(dartScore({ number: 20, multiplier: 3 })).toBe(60);
    expect(dartScore({ number: 25, multiplier: 1 })).toBe(25);
  });

  it("scores misses as zero", () => {
    expect(dartScore({ number: 17, multiplier: 0 })).toBe(0);
  });
});
