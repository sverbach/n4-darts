import { describe, expect, it } from "vitest";
import { defaultX01Settings, type MatchEvent, type X01Settings } from "./index.ts";
import { dartStats, matchStats, threeDartAverage } from "./stats.ts";

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

const full = (events: MatchEvent[], settings: Partial<X01Settings> = {}) =>
  matchStats({ ...defaultX01Settings, ...settings }, events);
const miss = [dart("M"), dart("M"), dart("M"), takeout];
const visit = (...names: string[]) => [...names.map((n) => dart(n)), takeout];

describe("match stats", () => {
  it("counts 180s, 140+ and 100+ visits and the first-9 average", () => {
    const [ann] = full(
      [
        start(),
        ...visit("T20", "T20", "T20"),
        ...miss,
        ...visit("T20", "T20", "S20"),
        ...miss,
        ...visit("T20", "S20", "S20"),
        ...miss,
        ...visit("S20", "S20", "S20"),
      ],
      { startScore: 701 },
    );
    expect(ann).toMatchObject({ s180: 1, s140: 1, s100: 1, darts: 12, points: 480 });
    expect(ann?.first9).toEqual({ darts: 9, points: 420 });
  });

  it("counts darts at a one-dart finish and the hits, double out only", () => {
    const events = [start(), ...visit("D10", "S10", "D5")];
    const [ann, bob] = full(events, { startScore: 40, outRule: "double" });
    expect(ann).toMatchObject({
      checkoutAttempts: 3,
      checkoutHits: 1,
      highestCheckout: 40,
      legsPlayed: 1,
      legsWon: 1,
      bestLeg: 3,
      won: true,
    });
    expect(bob).toMatchObject({ legsPlayed: 1, legsWon: 0, won: false, bestLeg: null });

    const straight = full([start(), ...visit("S20", "S20")], { startScore: 40 })[0];
    expect(straight).toMatchObject({ checkoutAttempts: 0, checkoutHits: 0, highestCheckout: 40 });
  });

  it("goes back to the score before a bust", () => {
    const events = [start(), ...visit("T20"), ...miss, ...visit("D20")];
    expect(full(events, { startScore: 40, outRule: "double" })[0]).toMatchObject({
      checkoutAttempts: 2,
      checkoutHits: 1,
      points: 40,
      darts: 2,
    });
  });

  it("counts legs in a match of three", () => {
    const events = [
      start(3),
      ...visit("D20"), // leg 1: Ann
      ...visit("D20"), // leg 2: Bob starts and wins
      ...visit("S1"), // leg 3: Cid starts
      ...visit("D20"), // Ann wins the match
    ];
    const [ann, bob, cid] = full(events, { startScore: 40, legsToWin: 2 });
    expect([ann, bob, cid].map((s) => [s?.legsPlayed, s?.legsWon, s?.won])).toEqual([
      [3, 2, true],
      [3, 1, false],
      [3, 0, false],
    ]);
    expect(ann?.bestLeg).toBe(1);
  });

  it("uses corrected segments", () => {
    const events: MatchEvent[] = [
      start(),
      dart("S20", "x"),
      takeout,
      { type: "DartCorrected", dartId: "x", segment: seg("T20") },
    ];
    expect(full(events)[0]).toMatchObject({ points: 60, darts: 1 });
  });
});
