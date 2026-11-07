import { beforeEach, describe, expect, it } from "vitest";
import {
  BERMUDA_ROUNDS,
  type BermudaSettings,
  type BermudaTarget,
  bermudaTarget,
  CLASSIC,
  defaultBermudaSettings,
  drawBermudaTargets,
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

const start = (playerCount = 2, targets?: BermudaTarget[]): MatchEvent => ({
  type: "MatchStarted",
  playerCount,
  ...(targets ? { targets } : {}),
});
const dart = (name: string, dartId = `d${++nextId}`): MatchEvent => ({
  type: "DartThrown",
  dartId,
  segment: seg(name),
});
const takeout: MatchEvent = { type: "TakeoutFinished" };
const visit = (...names: string[]) => [...names.map((n) => dart(n)), takeout];
const miss = (visits: number) => Array.from({ length: visits }, () => visit("M", "M", "M")).flat();

const play = (events: MatchEvent[], settings: Partial<BermudaSettings> = {}) =>
  matchState({ ...defaultBermudaSettings, ...settings }, events);

/** A dart that hits the classic round's target. */
function hit(round: number): string {
  const target = CLASSIC[round - 1];
  if (target === "double") return "D1";
  if (target === "treble") return "T1";
  if (target === 25) return "25";
  if (target === 50) return "BULL";
  return `S${target}`;
}

/** The rounds up to `last`, each player throwing `darts(target)` in turn. */
function rounds(last: number, ...darts: ((round: number) => string[])[]): MatchEvent[] {
  const events: MatchEvent[] = [];
  for (let round = 1; round <= last; round++) {
    for (const thrown of darts) events.push(...visit(...thrown(round)));
  }
  return events;
}

describe("Bermuda", () => {
  it("plays the 13 targets in the classic order", () => {
    expect(CLASSIC).toEqual([12, 13, 14, "double", 15, 16, 17, "treble", 18, 19, 20, 25, 50]);
    expect(play([start()]).targets).toEqual(CLASSIC);
  });

  it("scores the full value of every hit on the round's number", () => {
    const state = play([start(), ...visit("T12", "S12", "S5"), ...visit("D12")]);
    expect(state.players.map((p) => p.total)).toEqual([48, 24]);
    expect(state.players[0]?.rounds[0]).toEqual({ scored: 48, halved: false });
  });

  it("counts any double or any treble in those rounds, the bullseye as a double", () => {
    const toDoubles = rounds(
      3,
      (r) => [`T${11 + r}`],
      () => ["M"],
    );
    const doubles = play([start(), ...toDoubles, dart("D7"), dart("BULL"), dart("T7")]);
    expect(doubles.players[0]?.total).toBe(36 + 39 + 42 + 14 + 50);

    const toTrebles = rounds(
      7,
      (r) => [hit(r)],
      (r) => [hit(r)],
    );
    const trebles = play([start(), ...toTrebles, dart("T5"), dart("D20"), dart("T1")]);
    expect(bermudaTarget(8, CLASSIC)).toBe("treble");
    expect(trebles.players[0]?.rounds[7]).toEqual({ scored: 18, halved: false });
  });

  it("counts 25 and 50 in the outer-bull round, only 50 in the bull round", () => {
    const toBulls = rounds(
      11,
      () => ["M"],
      () => ["M"],
    );
    const outer = play([start(), ...toBulls, ...visit("25", "BULL", "M")]);
    expect(outer.players[0]?.rounds[11]).toEqual({ scored: 75, halved: false });

    const bull = play([start(), ...toBulls, ...visit("M"), ...visit("M"), ...visit("25", "BULL")]);
    expect(bull.players[0]?.rounds[12]).toEqual({ scored: 50, halved: false });
  });

  it("halves the total, rounded down, for a visit with no hits", () => {
    const state = play([
      start(),
      ...visit("T12", "S12", "S1"),
      ...visit("M"),
      ...visit("S1", "S1", "S1"),
    ]);
    expect(state.players[0]?.total).toBe(24);
    expect(state.players[0]?.rounds[1]).toEqual({ scored: 0, halved: true });

    const odd = rounds(
      3,
      (r) => (r === 3 ? ["M"] : [hit(r)]),
      () => ["M"],
    );
    expect(play([start(), ...odd]).players[0]?.total).toBe(Math.floor((12 + 13) / 2));
    expect(play([start(), ...visit("S1", "S1", "S1")]).players[0]?.total).toBe(0);
  });

  it("halves a visit taken out early, even with no darts", () => {
    const events = [start(), ...visit("T12"), ...visit("M"), takeout];
    expect(play(events).players[0]?.total).toBe(18);
    expect(play(events).players[0]?.rounds[1]).toEqual({ scored: 0, halved: true });
  });

  it("shows a visit's hits so far, and halves only once it's over", () => {
    const events = [start(), ...visit("T12"), ...visit("M"), dart("S1")];
    expect(play(events).players[0]?.total).toBe(36);
    expect(play(events).players[0]?.rounds[1]).toBeNull();
    expect(play([...events, dart("S13")]).players[0]?.total).toBe(49);
  });

  it("wins with the highest total after 13 rounds", () => {
    // Halving takes any earlier lead back to 0, so it's decided at the bull.
    const events = [start(), ...miss(2 * (BERMUDA_ROUNDS - 1)), ...visit("BULL"), ...visit("M")];
    expect(play(events).winner).toBe(0);
    expect(play(events.slice(0, -1)).winner).toBeNull();
  });

  it("goes to sudden death at the bull when level after 13 rounds", () => {
    const tied = [start(3), ...miss(3 * 12), ...visit("BULL"), ...visit("M"), ...visit("BULL")];
    const state = play(tied);
    expect(state.suddenDeath).toBe(true);
    expect(state.contenders).toEqual([0, 2]);
    expect(upNext(state)).toBe(2);
    expect(bermudaTarget(state.round, state.targets)).toBe(25);

    // No halving in sudden death: two misses stay level.
    expect(play([...tied, ...visit("M"), ...visit("M")]).winner).toBeNull();
    expect(play([...tied, ...visit("M"), ...visit("M")]).players[0]?.total).toBe(50);
    expect(play([...tied, ...visit("25"), ...visit("BULL")]).winner).toBe(2);
  });

  it("plays a shuffled order drawn at the start, the same after a correction", () => {
    const targets = drawBermudaTargets();
    expect([...targets].sort()).toEqual([...CLASSIC].sort());

    const shuffled: BermudaTarget[] = ["double", ...CLASSIC.filter((t) => t !== "double")];
    const events: MatchEvent[] = [start(2, shuffled), dart("S5", "a"), takeout];
    expect(play(events, { order: "shuffled" }).players[0]?.total).toBe(0);
    events.push({ type: "DartCorrected", dartId: "a", segment: seg("D5") });
    const state = play(events, { order: "shuffled" });
    expect(state.players[0]?.total).toBe(10);
    expect(state.targets).toEqual(shuffled);
  });

  it("refuses a shuffled start without each target once", () => {
    expect(() => play([start()], { order: "shuffled" })).toThrow();
    expect(() => play([start(2, [...CLASSIC.slice(1), 11])], { order: "shuffled" })).toThrow();
  });

  it("refuses a rules version it doesn't know", () => {
    expect(() => play([start()], { rulesVersion: 2 })).toThrow();
  });
});
