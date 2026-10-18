import { describe, expect, it } from "vitest";
import { defaultX01Settings, type MatchEvent, type X01Settings } from "./index.ts";
import { dartStats, threeDartAverage } from "./stats.ts";

let nextId = 0;
const seg = (name: string) => {
  if (name === "M") return { number: 0, multiplier: 0 } as const;
  const multiplier = ({ S: 1, D: 2, T: 3 } as const)[name[0] as "S" | "D" | "T"];
  return { number: Number(name.slice(1)), multiplier };
};
const start = (playerCount = 2): MatchEvent => ({ type: "MatchStarted", playerCount });
const dart = (name: string, dartId = `d${++nextId}`): MatchEvent => ({
  type: "DartThrown",
  dartId,
  segment: seg(name),
});
const takeout: MatchEvent = { type: "TakeoutFinished" };
const stats = (events: MatchEvent[], settings: Partial<X01Settings> = {}) =>
  dartStats({ ...defaultX01Settings, ...settings }, events);

describe("dart stats", () => {
  it("adds up points and darts per player", () => {
    expect(
      stats([start(), dart("T20"), dart("S5"), dart("S1"), takeout, dart("S20"), takeout]),
    ).toEqual([
      { points: 66, darts: 3 },
      { points: 20, darts: 1 },
    ]);
  });

  it("counts a bust's darts for zero points", () => {
    expect(stats([start(), dart("S20"), dart("T20"), takeout], { startScore: 40 })[0]).toEqual({
      points: 0,
      darts: 2,
    });
  });

  it("leaves out darts thrown after the visit was over", () => {
    const result = stats([start(), dart("T20"), dart("T20"), dart("T20"), dart("T20"), takeout]);
    expect(result[0]).toEqual({ points: 180, darts: 3 });
  });

  it("counts a checkout on the first dart and the rest of the leg", () => {
    const result = stats([start(), dart("D20"), dart("S5"), takeout], { startScore: 40 });
    expect(result[0]).toEqual({ points: 40, darts: 1 });
  });

  it("uses corrected segments", () => {
    const result = stats([
      start(),
      dart("S1", "a"),
      { type: "DartCorrected", dartId: "a", segment: seg("T20") },
    ]);
    expect(result[0]).toEqual({ points: 60, darts: 1 });
  });

  it("covers every leg and every player of a bigger match", () => {
    const won = [dart("D20"), takeout];
    const result = stats([start(3), ...won, ...won], { startScore: 40, legsToWin: 2 });
    // Leg 1: player 0 checks out. Leg 2: player 1 starts and checks out.
    expect(result).toEqual([
      { points: 40, darts: 1 },
      { points: 40, darts: 1 },
      { points: 0, darts: 0 },
    ]);
  });

  it("is empty before the match starts", () => {
    expect(stats([])).toEqual([]);
  });
});

describe("3-dart average", () => {
  it("is points per dart times three, over any number of matches", () => {
    expect(
      threeDartAverage([
        { points: 60, darts: 3 },
        { points: 30, darts: 3 },
      ]),
    ).toBe(45);
  });

  it("is null without darts", () => {
    expect(threeDartAverage([])).toBeNull();
    expect(threeDartAverage([{ points: 0, darts: 0 }])).toBeNull();
  });
});
