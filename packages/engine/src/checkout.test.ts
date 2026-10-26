import { describe, expect, it } from "vitest";
import { checkoutRoute, type OutRule, type Segment } from "./index.ts";

// Route notation used in tests: S20 / D20 / T20, 25 (outer bull), Bull (bullseye).
function name(s: Segment): string {
  if (s.number === 25) return s.multiplier === 2 ? "Bull" : "25";
  return `${["", "S", "D", "T"][s.multiplier]}${s.number}`;
}

const route = (remaining: number, dartsLeft: number, outRule: OutRule = "double") =>
  checkoutRoute(remaining, dartsLeft, outRule)?.map(name).join(" ") ?? null;

/** Every field a dart can score in, for checking routes independently of the search. */
const allFields: Segment[] = [
  ...[1, 2, 3].flatMap((multiplier) =>
    Array.from({ length: 20 }, (_, i) => ({ number: i + 1, multiplier }) as Segment),
  ),
  { number: 25, multiplier: 1 },
  { number: 25, multiplier: 2 },
];
const points = (s: Segment) => s.number * s.multiplier;

/** The fewest darts that finish `remaining` under double out, by brute force. */
function fewestDarts(remaining: number): number | null {
  const doubles = allFields.filter((s) => s.multiplier === 2).map(points);
  const any = new Set(allFields.map(points));
  if (doubles.includes(remaining)) return 1;
  if (doubles.some((d) => any.has(remaining - d))) return 2;
  if (doubles.some((d) => [...any].some((a) => any.has(remaining - d - a)))) return 3;
  return null;
}

describe("double out, every score", () => {
  const scores = Array.from({ length: 169 }, (_, i) => i + 2);

  it.each([1, 2, 3])("finishes on a double with the fewest darts, %i darts left", (dartsLeft) => {
    for (const remaining of scores) {
      const found = checkoutRoute(remaining, dartsLeft, "double");
      const fewest = fewestDarts(remaining);
      if (fewest === null || fewest > dartsLeft) {
        expect(found, `${remaining}`).toBeNull();
        continue;
      }
      expect(found?.length, `${remaining}`).toBe(fewest);
      expect(
        found?.reduce((sum, s) => sum + points(s), 0),
        `${remaining}`,
      ).toBe(remaining);
      expect(found?.at(-1)?.multiplier, `${remaining}`).toBe(2);
    }
  });

  it.each([169, 168, 166, 165, 163, 162, 159])("gives nothing for %i", (remaining) => {
    expect(route(remaining, 3)).toBeNull();
  });

  it("gives nothing above 170, at 1, or with no darts left", () => {
    expect(route(171, 3)).toBeNull();
    expect(route(1, 3)).toBeNull();
    expect(route(40, 0)).toBeNull();
  });
});

describe("double out, the route picked", () => {
  // Routes that agree with common checkout tables.
  it.each([
    [170, 3, "T20 T20 Bull"],
    [167, 3, "T20 T19 Bull"],
    [164, 3, "T20 T18 Bull"],
    [161, 3, "T20 T17 Bull"],
    [160, 3, "T20 T20 D20"],
    [140, 3, "T20 T16 D16"],
    [130, 3, "T20 T10 D20"],
    [120, 3, "T20 S20 D20"],
    [110, 3, "T20 Bull"],
    [100, 3, "T20 D20"],
    [100, 2, "T20 D20"],
    [90, 2, "T18 D18"],
    [80, 2, "T16 D16"],
    [70, 2, "T10 D20"],
    [62, 2, "T10 D16"],
    [60, 3, "S20 D20"],
    [60, 2, "S20 D20"],
    [50, 1, "Bull"],
    [41, 2, "S1 D20"],
    [40, 1, "D20"],
    [32, 1, "D16"],
    [3, 2, "S1 D1"],
  ])("%i with %i darts: %s", (remaining, dartsLeft, expected) => {
    expect(route(remaining, dartsLeft)).toBe(expected);
  });

  // Where the rules (fewest darts, then a good double, then easy setup darts) differ from the
  // common tables, which are given in the comment.
  it.each([
    [101, 3, "T17 Bull"], // T20 S1 D20: our rules take two darts over three
    [99, 3, "T19 S2 D20"], // T19 S10 D16
    [65, 2, "25 D20"], // T19 D4
    [61, 2, "T7 D20"], // T15 D8 or 25 D18
    [123, 3, "T20 T9 D18"], // T19 T16 D9
  ])("%i with %i darts: %s", (remaining, dartsLeft, expected) => {
    expect(route(remaining, dartsLeft)).toBe(expected);
  });

  it("follows the darts left in the visit", () => {
    expect(route(100, 3)).toBe("T20 D20");
    expect(route(60, 2)).toBe("S20 D20");
    expect(route(40, 1)).toBe("D20");
    expect(route(60, 1)).toBeNull();
  });
});

describe("straight out", () => {
  it.each([
    [1, 1, "S1"],
    [20, 1, "S20"],
    [40, 1, "D20"],
    [60, 1, "T20"],
    [50, 1, "Bull"],
    [80, 2, "T20 S20"],
    [100, 3, "T20 D20"],
    [180, 3, "T20 T20 T20"],
  ])("%i with %i darts: %s", (remaining, dartsLeft, expected) => {
    expect(route(remaining, dartsLeft, "straight")).toBe(expected);
  });

  it("gives nothing when it can't be scored", () => {
    expect(route(179, 3, "straight")).toBeNull();
    expect(route(61, 1, "straight")).toBeNull();
  });
});

describe("master out", () => {
  it.each([
    [57, 1, "T19"],
    [60, 1, "T20"],
    [40, 1, "D20"],
    [100, 3, "T20 D20"],
    [180, 3, "T20 T20 T20"],
    [171, 3, "T20 T17 T20"],
  ])("%i with %i darts: %s", (remaining, dartsLeft, expected) => {
    expect(route(remaining, dartsLeft, "master")).toBe(expected);
  });

  it("gives nothing for 1 or above 180", () => {
    expect(route(1, 3, "master")).toBeNull();
    expect(route(181, 3, "master")).toBeNull();
  });
});
