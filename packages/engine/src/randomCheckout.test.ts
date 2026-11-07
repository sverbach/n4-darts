import { beforeEach, describe, expect, it } from "vitest";
import {
  checkoutPool,
  DIFFICULTY,
  defaultRandomCheckoutSettings,
  drawCheckouts,
  type MatchEvent,
  matchState,
  RANDOM_CHECKOUT_DIFFICULTIES,
  type RandomCheckoutSettings,
  SUDDEN_DEATH_DRAWS,
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

const start = (checkouts: number[], playerCount = 2): MatchEvent => ({
  type: "MatchStarted",
  playerCount,
  checkouts,
});
const dart = (name: string, dartId = `d${++nextId}`): MatchEvent => ({
  type: "DartThrown",
  dartId,
  segment: seg(name),
});
const takeout: MatchEvent = { type: "TakeoutFinished" };
const visit = (...names: string[]) => [...names.map((n) => dart(n)), takeout];

const play = (events: MatchEvent[], settings: Partial<RandomCheckoutSettings> = {}) =>
  matchState({ ...defaultRandomCheckoutSettings, ...settings }, events);

/** Ten Beginner numbers: 32 first, then 2s. */
const BEGINNER = [32, 2, 2, 2, 2, 2, 2, 2, 2, 2];
const MEDIUM = [81, 60, 60, 60, 60, 60, 60, 60, 60, 60];

describe("Random Checkout", () => {
  it("draws only numbers each difficulty can finish in three darts", () => {
    expect(checkoutPool("beginner")).toEqual(Array.from({ length: 39 }, (_, i) => i + 2));
    expect(checkoutPool("hard")).not.toContain(169);
    expect(checkoutPool("hard")).not.toContain(159);
    expect(checkoutPool("hard")).toContain(170);
    expect(checkoutPool("mixed")).toHaveLength(169 - 7);

    for (const difficulty of RANDOM_CHECKOUT_DIFFICULTIES) {
      const drawn = drawCheckouts(difficulty, 20);
      const { from, to } = DIFFICULTY[difficulty];
      expect(drawn).toHaveLength(20 + SUDDEN_DEATH_DRAWS);
      expect(drawn.every((n) => n >= from && n <= to)).toBe(true);
      expect(drawn.every((n) => checkoutPool(difficulty).includes(n))).toBe(true);
    }
  });

  it("doesn't repeat a number before the pool runs out", () => {
    const drawn = drawCheckouts("beginner", 20);
    expect(new Set(drawn.slice(0, 39)).size).toBe(39);
  });

  it("refuses a start without a fitting number per round", () => {
    expect(() => play([{ type: "MatchStarted", playerCount: 2 }])).toThrow();
    expect(() => play([start([32, 2])])).toThrow();
    expect(() => play([start(MEDIUM)])).toThrow();
    expect(() => play([start([169, ...MEDIUM.slice(1)])], { difficulty: "hard" })).toThrow();
  });

  it("gives everyone the round's number, a point for each checkout", () => {
    const state = play([start(BEGINNER), ...visit("S16", "D8"), ...visit("S20", "S12")]);

    expect(state.round).toBe(2);
    expect(state.target).toBe(2);
    expect(state.players.map((p) => p.points)).toEqual([1, 1]);
    expect(state.players.map((p) => p.results)).toEqual([[true], [true]]);
  });

  it("finishes on any dart in Beginner, but only on a double above it", () => {
    expect(play([start(BEGINNER), dart("T10"), dart("S2")]).players[0]?.points).toBe(1);

    const single = play([start(MEDIUM), dart("T20"), dart("S1")], {
      difficulty: "medium",
    });
    expect(single.currentVisit?.bust).toBe(false);
    expect(single.remaining).toBe(20);
    const finished = play([start(MEDIUM), dart("T20"), dart("S1"), dart("S20")], {
      difficulty: "medium",
    });
    expect(finished.currentVisit?.bust).toBe(true);
    expect(finished.players[0]?.points).toBe(0);
    const double = play([start(MEDIUM), dart("T20"), dart("S1"), dart("D10")], {
      difficulty: "medium",
    });
    expect(double.players[0]?.points).toBe(1);
  });

  it("ends the visit on the finishing or busting dart", () => {
    const checkedOut = play([start(BEGINNER), dart("D16"), dart("T20")]);
    expect(checkedOut.phase).toBe("awaitingTakeout");
    expect(checkedOut.currentVisit?.darts.map((d) => d.ignored)).toEqual([false, true]);
    expect(checkedOut.players[0]?.results).toEqual([true]);

    const bust = play([start(BEGINNER), dart("T20")]);
    expect(bust.phase).toBe("awaitingTakeout");
    expect(bust.currentVisit?.bust).toBe(true);
    expect(bust.remaining).toBe(32);
    expect(bust.players[0]?.results).toEqual([false]);
  });

  it("counts down what the thrower has left of the number", () => {
    const state = play([start(BEGINNER), dart("S10")]);
    expect(state.remaining).toBe(22);
    expect(state.players[0]?.results).toEqual([null]);
    expect(play([start(BEGINNER), ...visit("S10")]).remaining).toBe(32);
  });

  it("fails a visit taken out early or with three darts short", () => {
    const early = play([start(BEGINNER), ...visit("S10")]);
    expect(early.players[0]?.results).toEqual([false]);

    const short = play([start(BEGINNER), ...visit("S1", "S1", "S1")]);
    expect(short.players[0]?.results).toEqual([false]);
    expect(short.currentPlayer).toBe(1);
  });

  it("wins with the most points after the rounds", () => {
    const events = [start(BEGINNER), ...visit("D16"), ...visit("M")];
    for (let round = 2; round <= 10; round++) events.push(...visit("M"), ...visit("M"));

    expect(play(events).winner).toBe(0);
    expect(play(events.slice(0, -1)).winner).toBeNull();
  });

  it("plays sudden death on fresh numbers until one leader is ahead", () => {
    const checkouts = [...BEGINNER, 40, 36, 2];
    const events = [start(checkouts, 3), ...visit("D16"), ...visit("M"), ...visit("D16")];
    for (let round = 2; round <= 10; round++)
      events.push(...visit("M"), ...visit("M"), ...visit("M"));
    const state = play(events);

    expect(state.suddenDeath).toBe(true);
    expect(state.contenders).toEqual([0, 2]);
    expect(state.target).toBe(40);
    expect(upNext(state)).toBe(2);

    const level = [...events, ...visit("D20"), ...visit("D20")];
    expect(play(level).winner).toBeNull();
    expect(play(level).target).toBe(36);
    expect(play([...level, ...visit("M"), ...visit("D18")]).winner).toBe(2);
  });

  it("starts the draw over when sudden death runs past it", () => {
    const events = [start(BEGINNER), ...visit("M"), ...visit("M")];
    for (let round = 2; round <= 10; round++) events.push(...visit("M"), ...visit("M"));
    const state = play(events);

    expect(state.round).toBe(11);
    expect(state.target).toBe(32);
  });

  it("replays a correction with the same numbers", () => {
    const events: MatchEvent[] = [start(BEGINNER), dart("S5", "a"), takeout];
    expect(play(events).players[0]?.points).toBe(0);

    events.push({ type: "DartCorrected", dartId: "a", segment: seg("D16") });
    const state = play(events);
    expect(state.players[0]?.points).toBe(1);
    expect(state.target).toBe(32);
  });

  it("refuses a rules version it doesn't know", () => {
    expect(() => play([start(BEGINNER)], { rulesVersion: 2 })).toThrow();
  });
});
