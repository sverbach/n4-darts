import { beforeEach, describe, expect, it } from "vitest";
import {
  defaultKillerSettings,
  drawKillerNumbers,
  type KillerSettings,
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

const start = (numbers = [1, 2]): MatchEvent => ({
  type: "MatchStarted",
  playerCount: numbers.length,
  numbers,
});
const dart = (name: string, dartId = `d${++nextId}`): MatchEvent => ({
  type: "DartThrown",
  dartId,
  segment: seg(name),
});
const takeout: MatchEvent = { type: "TakeoutFinished" };
const visit = (...names: string[]) => [...names.map((n) => dart(n)), takeout];

const play = (events: MatchEvent[], settings: Partial<KillerSettings> = {}) =>
  matchState({ ...defaultKillerSettings, ...settings }, events);

describe("Killer", () => {
  it("gives every player their drawn number and the lives", () => {
    const state = play([start([7, 12, 3])], { lives: 5 });

    expect(state.players.map((p) => [p.number, p.lives, p.charge, p.killer])).toEqual([
      [7, 5, 0, false],
      [12, 5, 0, false],
      [3, 5, 0, false],
    ]);
  });

  it("refuses a start without a distinct number per player", () => {
    expect(() => play([{ type: "MatchStarted", playerCount: 2 }])).toThrow();
    expect(() => play([start([4, 4])])).toThrow();
    expect(() => play([start([0, 21])])).toThrow();
  });

  it("draws distinct numbers from 1 to 20", () => {
    for (let i = 0; i < 20; i++) {
      const numbers = drawKillerNumbers(8);
      expect(new Set(numbers).size).toBe(8);
      expect(numbers.every((n) => n >= 1 && n <= 20)).toBe(true);
    }
  });

  it("charges on your own number, single 1, double 2, treble 3, and drops the extra", () => {
    expect(play([start(), dart("S1")]).players[0]?.charge).toBe(1);
    expect(play([start(), dart("D1")]).players[0]?.charge).toBe(2);
    const killer = play([start(), dart("D1"), dart("T1")]).players[0];
    expect(killer).toMatchObject({ charge: 3, killer: true });
  });

  it("makes doubles do nothing before you're a killer", () => {
    const state = play([start(), ...visit("D2", "D2", "D2")]);

    expect(state.players[1]?.lives).toBe(3);
  });

  it("takes a life with a double of someone else's number, only once you're a killer", () => {
    const state = play([start(), dart("T1"), dart("D2"), dart("S2"), dart("T2")]);

    expect(state.players[1]?.lives).toBe(2);
    expect(state.currentVisit?.darts.map((d) => d.score)).toEqual([1, 1, 0, 0]);
  });

  it("never takes charge away when others hit your number", () => {
    const state = play([start(), ...visit("S1"), ...visit("T1")]);

    expect(state.players[0]?.charge).toBe(1);
  });

  it("costs a killer a life for their own double", () => {
    const state = play([start(), dart("T1"), dart("D1")]);

    expect(state.players[0]).toMatchObject({ killer: true, lives: 2 });
  });

  it("skips players who are out, and ignores darts at their number", () => {
    const events = [start([1, 2, 3]), ...visit("T1", "D2", "D2"), dart("D2")];
    const state = play(events, { lives: 2 });

    expect(state.players[1]?.lives).toBe(0);
    expect(state.currentPlayer).toBe(2);
    expect(state.currentVisit?.darts[0]?.score).toBe(0);
    expect(upNext(state)).toBe(0);
  });

  it("wins on the spot for the last player with lives", () => {
    const state = play([start(), dart("T1"), dart("D2"), dart("D2")], { lives: 2 });

    expect(state.phase).toBe("matchWon");
    expect(state.winner).toBe(0);
  });

  it("ends a visit when the thrower knocks themselves out", () => {
    const events = [start([1, 2, 3]), dart("T1"), dart("D1"), dart("S3")];
    const state = play(events, { lives: 1 });

    expect(state.players[0]?.lives).toBe(0);
    expect(state.phase).toBe("awaitingTakeout");
    expect(state.currentVisit?.darts.at(-1)?.ignored).toBe(true);
  });

  it("lets a killer knock themselves out, leaving the last player the winner", () => {
    const state = play([start(), dart("T1"), dart("D1")], { lives: 1 });

    expect(state.winner).toBe(1);
  });

  it("replays a correction that takes a kill back", () => {
    const events: MatchEvent[] = [start(), dart("T1"), dart("D2", "kill"), takeout];
    expect(play(events).players[1]?.lives).toBe(2);

    events.push({ type: "DartCorrected", dartId: "kill", segment: seg("S2") });
    expect(play(events).players[1]?.lives).toBe(3);
  });

  it("refuses a rules version it doesn't know", () => {
    expect(() => play([start()], { rulesVersion: 2 })).toThrow();
  });
});
