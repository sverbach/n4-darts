import { beforeEach, describe, expect, it } from "vitest";
import {
  type CricketSettings,
  defaultCricketSettings,
  type MatchEvent,
  matchState,
  upNext,
} from "./index.ts";

let nextId = 0;
beforeEach(() => {
  nextId = 0;
});

function seg(name: string) {
  if (name === "M") return { number: 0, multiplier: 0 } as const;
  if (name === "25") return { number: 25, multiplier: 1 } as const;
  if (name === "BULL") return { number: 25, multiplier: 2 } as const;
  const multiplier = ({ S: 1, D: 2, T: 3 } as const)[name[0] as "S" | "D" | "T"];
  return { number: Number(name.slice(1)), multiplier };
}

const start = (playerCount = 2): MatchEvent => ({ type: "MatchStarted", playerCount });
const dart = (name: string, dartId = `d${++nextId}`): MatchEvent => ({
  type: "DartThrown",
  dartId,
  segment: seg(name),
});
const takeout: MatchEvent = { type: "TakeoutFinished" };
const visit = (...names: string[]) => [...names.map((n) => dart(n)), takeout];
const miss = (players: number) =>
  Array.from({ length: players }, () => visit("M", "M", "M")).flat();

const play = (events: MatchEvent[], settings: Partial<CricketSettings> = {}) =>
  matchState({ ...defaultCricketSettings, ...settings }, events);

const closeAll = [
  ...visit("T20", "T19", "T18"),
  ...visit("M"),
  ...visit("T17", "T16", "T15"),
  ...visit("M"),
];

describe("Cricket", () => {
  it("counts marks: single 1, double 2, treble 3, outer bull 1, bull 2", () => {
    const state = play([start(), ...visit("S20", "D19", "T18"), ...visit("25", "BULL", "S5")]);

    expect(state.players[0]?.marks).toMatchObject({ 20: 1, 19: 2, 18: 3 });
    expect(state.players[1]?.marks[25]).toBe(3);
    expect(state.currentVisit).toBeNull();
  });

  it("ignores numbers below 15", () => {
    const state = play([start(), ...visit("T14", "T1", "S5")]);

    expect(Object.values(state.players[0]?.marks ?? {})).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it("scores the marks past closing while an opponent has it open", () => {
    const state = play([start(), ...visit("T20", "T20", "S20")]);

    expect(state.players[0]?.points).toBe(80);
  });

  it("splits a dart between closing and scoring", () => {
    const state = play([start(), ...visit("D20", "T20")]);

    expect(state.players[0]?.marks[20]).toBe(5);
    expect(state.players[0]?.points).toBe(40);
  });

  it("scores nothing once everyone has closed the number", () => {
    const state = play([start(), ...visit("T20"), ...visit("T20"), ...visit("T20")]);

    expect(state.players.map((p) => p.points)).toEqual([0, 0]);
  });

  it("gives the points to every opponent still open in cut-throat", () => {
    const events = [start(3), ...visit("T20"), ...visit("T20"), ...visit("M"), ...visit("T20")];
    const state = play(events, { variant: "cutThroat" });

    expect(state.players.map((p) => p.points)).toEqual([0, 0, 60]);
  });

  it("wins on the spot once everything is closed with the most points", () => {
    const events = [start(), ...closeAll, dart("D25")];
    const done = play([start(), ...closeAll, dart("BULL"), dart("25")]);

    expect(play(events).winner).toBeNull();
    expect(done.winner).toBe(0);
    expect(done.phase).toBe("matchWon");
  });

  it("doesn't win while behind on points", () => {
    const events = [
      start(),
      ...visit("M"),
      ...visit("T20", "T20", "T20"),
      ...visit("T20", "T19", "T18"),
      ...visit("M"),
      ...visit("T17", "T16", "T15"),
      ...visit("M"),
      dart("BULL"),
      dart("25"),
    ];
    const state = play(events);

    expect(state.players.map((p) => p.points)).toEqual([0, 120]);
    expect(state.winner).toBeNull();
  });

  it("wins in cut-throat with the fewest points, a tie counting for the closer", () => {
    const events = [start(), ...closeAll, dart("BULL"), dart("25")];

    expect(play(events, { variant: "cutThroat" }).winner).toBe(0);
  });

  it("stops after 50 rounds: most points, then most marks", () => {
    const rounds = (n: number) => miss(2 * n);
    const points = [start(), ...visit("T20", "T20"), ...visit("M"), ...rounds(49)];
    expect(play(points).winner).toBe(0);

    const marks = [start(), ...visit("M"), ...visit("S19"), ...rounds(49)];
    expect(play(marks).winner).toBe(1);
  });

  it("goes to sudden death at the bull when still level after 50 rounds", () => {
    const level = [start(3), ...visit("S20"), ...visit("M"), ...visit("S20"), ...miss(3 * 49)];
    const state = play(level);
    expect(state.suddenDeath).toBe(true);
    expect(state.contenders).toEqual([0, 2]);
    expect(upNext(state)).toBe(2);

    expect(play([...level, ...visit("BULL"), ...visit("25", "S20")]).winner).toBe(0);
    expect(play([...level, ...visit("25"), ...visit("25")]).winner).toBeNull();
  });

  it("replays a correction", () => {
    const events: MatchEvent[] = [start(), dart("T20", "a"), takeout];
    expect(play(events).players[0]?.marks[20]).toBe(3);

    events.push({ type: "DartCorrected", dartId: "a", segment: seg("S20") });
    expect(play(events).players[0]?.marks[20]).toBe(1);
  });

  it("refuses a rules version it doesn't know", () => {
    expect(() => play([start()], { rulesVersion: 2 })).toThrow();
  });
});
