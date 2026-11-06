import { beforeEach, describe, expect, it } from "vitest";
import {
  allVisits,
  defaultAroundTheClockSettings,
  type MatchEvent,
  matchState,
  storedSettings,
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

const play = (events: MatchEvent[]) => matchState(defaultAroundTheClockSettings, events);
const targets = (events: MatchEvent[]) => play(events).players.map((p) => p.target);

const run = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `S${from + i}`);

describe("Around the Clock", () => {
  it("starts everyone on 1", () => {
    const state = play([start(3)]);

    expect(state.phase).toBe("throwing");
    expect(state.players.map((p) => p.target)).toEqual([1, 1, 1]);
  });

  it("moves on one target per hit, whatever the ring", () => {
    expect(targets([start(), ...visit("S1", "D2", "T3")])).toEqual([4, 1]);
  });

  it("doesn't move on a miss or a dart at another number", () => {
    expect(targets([start(), ...visit("S2", "M", "S20")])).toEqual([1, 1]);
  });

  it("moves on mid-visit, before takeout", () => {
    const state = play([start(), dart("S1"), dart("S2")]);

    expect(state.players[0]?.target).toBe(3);
    expect(state.currentVisit?.darts.map((d) => d.score)).toEqual([1, 1]);
  });

  it("goes from 20 to the bull", () => {
    const darts = run(1, 20);
    const events: MatchEvent[] = [start()];
    for (let i = 0; i < darts.length; i += 3) {
      events.push(...visit(...darts.slice(i, i + 3)), ...visit("M", "M", "M"));
    }
    expect(play(events).players[0]?.target).toBe(25);
  });

  it.each(["25", "BULL"])("finishes on either bull (%s) and wins on the spot", (bull) => {
    const darts = run(1, 20);
    const events: MatchEvent[] = [start()];
    for (let i = 0; i < 18; i += 3) {
      events.push(...visit(...darts.slice(i, i + 3)), ...visit("M", "M", "M"));
    }
    events.push(dart("S19"), dart("S20"), dart(bull));
    const state = play(events);

    expect(state.phase).toBe("matchWon");
    expect(state.winner).toBe(0);
    expect(state.players[0]?.target).toBeNull();
  });

  it("ignores darts after the winning dart, and the next player doesn't get a visit", () => {
    const events: MatchEvent[] = [start()];
    const darts = [...run(1, 20), "25"];
    for (let i = 0; i < 21; i += 3) {
      const three = darts.slice(i, i + 3);
      events.push(...visit(...three));
      if (i < 18) events.push(...visit("M", "M", "M"));
    }
    const state = play(events);

    expect(state.winner).toBe(0);
    expect(state.visits.at(-1)?.player).toBe(0);
  });

  it("ignores a fourth dart", () => {
    const state = play([start(), dart("S1"), dart("S2"), dart("S3"), dart("S4")]);

    expect(state.phase).toBe("awaitingTakeout");
    expect(state.currentVisit?.darts.map((d) => d.ignored)).toEqual([false, false, false, true]);
    expect(state.players[0]?.target).toBe(4);
  });

  it("passes the turn on at takeout, round after round", () => {
    const state = play([start(3), ...visit("S1"), ...visit("M")]);

    expect(state.currentPlayer).toBe(2);
    expect(upNext(state)).toBe(0);
    expect(allVisits(state)).toHaveLength(2);
  });

  it("replays a correction", () => {
    const events: MatchEvent[] = [start(), dart("S1", "a"), dart("S5", "b"), takeout];
    expect(targets(events)).toEqual([2, 1]);

    events.push({ type: "DartCorrected", dartId: "b", segment: seg("S2") });
    expect(targets(events)).toEqual([3, 1]);
  });

  it("replays an undo", () => {
    const events: MatchEvent[] = [start(), ...visit("S1", "S2"), { type: "VisitUndone" }];

    expect(targets(events)).toEqual([1, 1]);
    expect(play(events).currentPlayer).toBe(0);
  });

  it("refuses a rules version it doesn't know", () => {
    expect(() =>
      matchState({ ...defaultAroundTheClockSettings, rulesVersion: 2 }, [start()]),
    ).toThrow();
  });
});

describe("stored settings", () => {
  it("reads settings without a mode as X01", () => {
    expect(storedSettings({ startScore: 501 })).toEqual({ mode: "x01", startScore: 501 });
  });

  it("keeps a stored mode", () => {
    expect(storedSettings(defaultAroundTheClockSettings)).toEqual(defaultAroundTheClockSettings);
  });
});
