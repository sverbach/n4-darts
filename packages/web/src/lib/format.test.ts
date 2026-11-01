import { describe, expect, it } from "vitest";
import { average, count, legScore, NONE, placing } from "./format.ts";

describe("formats", () => {
  it("writes an empty value as one dash", () => {
    expect(average(null)).toBe(NONE);
    expect(count(null)).toBe(NONE);
    expect(NONE).toBe("–");
  });

  it("gives averages one decimal and counts none", () => {
    expect(average(60.55)).toBe("60.5");
    expect(count(0)).toBe("0");
  });

  it("separates legs and shared places with an en dash", () => {
    expect(legScore([2, 1])).toBe("2–1");
    expect(placing(1, 1)).toBe("1");
    expect(placing(3, 4)).toBe("3–4");
  });
});
