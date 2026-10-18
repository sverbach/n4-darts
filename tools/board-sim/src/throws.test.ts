import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseRecording } from "./replay.ts";
import { ORDER, throwAt, throwFor } from "./throws.ts";

const recording = readFileSync(
  new URL("../../../prototypes/recordings/2026-10-18-board1.txt", import.meta.url),
  "utf8",
);

const notations = [
  "25",
  "BULL",
  ...ORDER.flatMap((n) => [`S${n}`, `SO${n}`, `D${n}`, `T${n}`, `M${n}`]),
];

describe("throwAt", () => {
  it.each(notations)("maps the spot %s lands on back to the same segment", (notation) => {
    // throwFor scatters every dart a little; try a few landings.
    for (let i = 0; i < 20; i++) {
      const thrown = throwFor(notation);
      expect(throwAt(thrown.coords)).toEqual(thrown);
    }
  });

  it("splits wedges halfway between numbers", () => {
    // 20 sits at the top, 1 one wedge (18°) clockwise; the boundary is at 9°.
    const at = (degrees: number) => {
      const radians = ((90 - degrees) * Math.PI) / 180;
      return throwAt({ x: 0.3 * Math.cos(radians), y: 0.3 * Math.sin(radians) }).segment.number;
    };
    expect(at(8.9)).toBe(20);
    expect(at(9.1)).toBe(1);
    expect(at(-8.9)).toBe(20);
    expect(at(-9.1)).toBe(5);
  });

  it("scores the ring edges", () => {
    const up = (y: number) => throwAt({ x: 0, y }).segment.name;
    const radii = [0, 0.036, 0.05, 0.092, 0.3, 0.6, 0.623, 0.8, 0.95, 0.99, 0.995];
    expect(radii.map(up)).toEqual([
      "Bull",
      "Bull",
      "25",
      "25",
      "S20",
      "T20",
      "T20",
      "S20",
      "D20",
      "D20",
      "M20",
    ]);
  });

  it("scores every real dart of a recording as the board did", () => {
    const real = parseRecording(recording)
      .flatMap((entry) => entry.state.throws ?? [])
      .filter((t) => !t.bouncer);

    expect(real.length).toBeGreaterThan(20);
    for (const dart of real) expect(throwAt(dart.coords).segment).toEqual(dart.segment);
  });
});
