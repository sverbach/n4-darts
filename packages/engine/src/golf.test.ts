import { beforeEach, describe, expect, it } from "vitest";
import {
  defaultGolfSettings,
  drawGolfCourse,
  type GolfSettings,
  holeTarget,
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

const play = (events: MatchEvent[], settings: Partial<GolfSettings> = {}) =>
  matchState({ ...defaultGolfSettings, course: "inOrder", ...settings }, events);

function holes(from: number, to: number, a: (n: number) => string[], b: (n: number) => string[]) {
  const events: MatchEvent[] = [];
  for (let hole = from; hole <= to; hole++) {
    const target = holeTarget(hole);
    events.push(...visit(...a(target)), ...visit(...b(target)));
  }
  return events;
}
const name = (target: number, ring: "S" | "D" | "T") =>
  target === 25 ? (ring === "D" ? "BULL" : "25") : `${ring}${target}`;

describe("Golf on a random course", () => {
  const course = [7, 25, 3, 20, 1, 2, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const randomStart = (playerCount = 2): MatchEvent => ({
    type: "MatchStarted",
    playerCount,
    course,
  });
  const random = (events: MatchEvent[], holes: 9 | 18 = 9) =>
    matchState({ ...defaultGolfSettings, course: "random", holes }, events);

  it("aims each hole at the drawn course", () => {
    const state = random([randomStart(), ...visit("T7"), ...visit("S7"), ...visit("BULL")]);

    expect(state.course).toEqual(course);
    expect(state.players.map((p) => p.holes)).toEqual([[1, 1], [3]]);
  });

  it("goes on through the rest of the draw in sudden death, then round again", () => {
    expect([9, 10, 21, 22].map((hole) => holeTarget(hole, course))).toEqual([6, 8, 19, 7]);
    const level: MatchEvent[] = [randomStart()];
    for (let hole = 1; hole <= 9; hole++) level.push(...visit("M"), ...visit("M"));
    const state = random(level);
    expect(state.suddenDeath).toBe(true);
    expect(holeTarget(state.round, state.course)).toBe(8);
  });

  it("refuses a random course without a valid draw", () => {
    expect(() => random([start()])).toThrow();
    expect(() => random([{ type: "MatchStarted", playerCount: 2, course: [1, 1, 2] }])).toThrow();
  });

  it("plays in order when the settings don't say", () => {
    const stored = matchState({ mode: "golf", holes: 9, rulesVersion: 1 }, [
      start(),
      ...visit("T1"),
    ]);
    expect(stored.players[0]?.holes).toEqual([1]);
  });

  it("draws each of 1–20 and the bull once", () => {
    const draw = drawGolfCourse();
    expect([...draw].sort((a, b) => a - b)).toEqual([
      ...Array.from({ length: 20 }, (_, i) => i + 1),
      25,
    ]);
  });
});

describe("Golf", () => {
  it("scores a hole by its best dart: treble 1, double 2, single 3, anything else 5", () => {
    const state = play([start(), ...visit("S1", "T1", "M"), ...visit("D1", "S5", "S1")]);

    expect(state.players.map((p) => p.holes[0])).toEqual([1, 2]);
    expect(state.round).toBe(2);
  });

  it("scores a missed hole 5", () => {
    expect(play([start(), ...visit("S2", "M", "S20")]).players[0]?.holes[0]).toBe(5);
  });

  it("keeps the best dart so far for a visit taken out early, and 5 for one with no darts", () => {
    const state = play([start(), ...visit("S1"), { type: "VisitEndedManually" }]);

    expect(state.players.map((p) => p.holes[0])).toEqual([3, 5]);
  });

  it("shows the best dart so far while the visit is on", () => {
    const state = play([start(), dart("S1"), dart("D1")]);

    expect(state.players[0]?.holes[0]).toBe(2);
    expect(state.players[0]?.total).toBe(2);
  });

  it("aims each hole at its number", () => {
    const state = play([start(), ...visit("T1"), ...visit("T1"), ...visit("T2")]);

    expect(state.players[0]?.holes).toEqual([1, 1]);
  });

  it("plays 9 holes, lowest total wins", () => {
    const events = [
      start(),
      ...holes(
        1,
        9,
        (n) => [`T${n}`],
        (n) => [`S${n}`],
      ),
    ];
    const state = play(events);

    expect(state.winner).toBe(0);
    expect(state.players.map((p) => p.total)).toEqual([9, 27]);
  });

  it("plays 18 holes when chosen", () => {
    const nine = [
      start(),
      ...holes(
        1,
        9,
        (n) => [`T${n}`],
        (n) => [`S${n}`],
      ),
    ];
    expect(play(nine, { holes: 18 }).winner).toBeNull();
    expect(play(nine, { holes: 18 }).round).toBe(10);
  });

  it("goes to sudden death on hole 10 after 9 level holes", () => {
    const events: MatchEvent[] = [start(3)];
    for (let hole = 1; hole <= 9; hole++) {
      events.push(...visit(`T${hole}`), ...visit(`S${hole}`), ...visit(`T${hole}`));
    }
    const state = play(events);

    expect(state.suddenDeath).toBe(true);
    expect(state.contenders).toEqual([0, 2]);
    expect(holeTarget(state.round)).toBe(10);
    expect(upNext(state)).toBe(2);

    expect(play([...events, ...visit("T10"), ...visit("S10")]).winner).toBe(0);
  });

  it("goes on through 19, 20, the bull and back to 1 after 18 level holes", () => {
    expect([19, 20, 21, 22].map((hole) => holeTarget(hole))).toEqual([19, 20, 25, 1]);

    const tied = [
      start(),
      ...holes(
        1,
        18,
        (n) => [name(n, "T")],
        (n) => [name(n, "T")],
      ),
    ];
    const throughBull = [
      ...tied,
      ...holes(
        19,
        21,
        (n) => [name(n, "D")],
        (n) => [name(n, "D")],
      ),
    ];
    const state = play(throughBull, { holes: 18 });
    expect(state.winner).toBeNull();
    expect(holeTarget(state.round)).toBe(1);

    const bull = play(
      [
        ...tied,
        ...holes(
          19,
          20,
          (n) => [name(n, "D")],
          (n) => [name(n, "D")],
        ),
        ...visit("BULL"),
        ...visit("25"),
      ],
      { holes: 18 },
    );
    expect(bull.winner).toBe(0);
  });

  it("replays a correction", () => {
    const events: MatchEvent[] = [start(), dart("S5", "a"), takeout];
    expect(play(events).players[0]?.holes[0]).toBe(5);

    events.push({ type: "DartCorrected", dartId: "a", segment: seg("T1") });
    expect(play(events).players[0]?.holes[0]).toBe(1);
  });

  it("refuses a rules version it doesn't know", () => {
    expect(() => play([start()], { rulesVersion: 2 })).toThrow();
  });
});
