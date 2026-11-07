import { defaultX01Settings, type MatchEvent, matchState } from "@n4/engine";
import { describe, expect, it } from "vitest";
import { raceOf } from "./race.ts";

let id = 0;
const dart = (number: number, multiplier: 0 | 1 | 2 | 3 = 1): MatchEvent => ({
  type: "DartThrown",
  dartId: `d${++id}`,
  segment: { number, multiplier },
});
const takeout: MatchEvent = { type: "TakeoutFinished" };
const start: MatchEvent = { type: "MatchStarted", playerCount: 2 };

describe("raceOf", () => {
  const settings = { ...defaultX01Settings, startScore: 101 };

  it("follows each player's remaining score round by round, to the checkout", () => {
    const state = matchState(settings, [
      start,
      dart(20, 3),
      dart(1),
      dart(1),
      takeout,
      dart(5),
      takeout,
      dart(19, 2),
    ]);
    const race = raceOf(state, 0, 101, 2);

    expect(race[0]?.points.map((p) => [p.round, p.left, p.scored])).toEqual([
      [0, 101, null],
      [1, 39, 62],
      [2, 1, 38],
    ]);
    expect(race[1]?.points.map((p) => p.left)).toEqual([101, 96]);
  });

  it("keeps the score flat on a bust and marks it", () => {
    const state = matchState(settings, [start, dart(20, 3), dart(20, 3), takeout]);
    const race = raceOf(state, 0, 101, 2);

    expect(race[0]?.points.at(-1)).toEqual({ round: 1, left: 101, scored: 0, bust: true });
  });

  it("is empty for a leg that doesn't exist", () => {
    expect(raceOf(matchState(settings, [start]), 3, 101, 2)).toEqual([]);
  });
});
