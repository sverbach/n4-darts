import { beforeEach, describe, expect, it } from "vitest";
import {
  defaultHighScoreSettings,
  type HighScoreSettings,
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

const play = (events: MatchEvent[], settings: Partial<HighScoreSettings> = {}) =>
  matchState({ ...defaultHighScoreSettings, ...settings }, events);
const totals = (events: MatchEvent[], settings: Partial<HighScoreSettings> = {}) =>
  play(events, settings).players.map((p) => p.total);

describe("High Score", () => {
  it("adds up every visit, the bull as 25 and 50", () => {
    expect(totals([start(), ...visit("T20", "25", "BULL"), ...visit("S1", "D2", "M")])).toEqual([
      135, 5,
    ]);
  });

  it("counts a visit in progress and ignores a fourth dart", () => {
    const state = play([start(), dart("T20"), dart("T20"), dart("T20"), dart("T20")]);

    expect(state.players[0]?.total).toBe(180);
    expect(state.phase).toBe("awaitingTakeout");
    expect(state.currentVisit?.darts.at(-1)?.ignored).toBe(true);
  });

  it("goes round by round", () => {
    const state = play([start(3), ...visit("S1"), ...visit("S1"), ...visit("S1"), ...visit("S1")]);

    expect(state.round).toBe(2);
    expect(state.currentPlayer).toBe(1);
    expect(upNext(state)).toBe(2);
  });

  it("ends after the last round's last visit, as soon as its third dart lands", () => {
    const events = [start(), ...visit("T20", "T20", "T20"), dart("S1"), dart("S1"), dart("S1")];
    const state = play(events, { rounds: 1 });

    expect(state.phase).toBe("matchWon");
    expect(state.winner).toBe(0);
  });

  it("ends when the last visit is taken out early", () => {
    const state = play([start(), ...visit("S1", "S1"), ...visit("S20")], { rounds: 1 });

    expect(state.winner).toBe(1);
  });

  it("goes to sudden death between the tied leaders only", () => {
    const events = [start(3), ...visit("T20"), ...visit("S5"), ...visit("T20")];
    const state = play(events, { rounds: 1 });

    expect(state.winner).toBeNull();
    expect(state.suddenDeath).toBe(true);
    expect(state.contenders).toEqual([0, 2]);
    expect(state.currentPlayer).toBe(0);
    expect(upNext(state)).toBe(2);
  });

  it("decides sudden death after a round, playing on while still tied", () => {
    const tied = [start(3), ...visit("T20"), ...visit("T20"), ...visit("T20")];

    const still = play([...tied, ...visit("S5"), ...visit("S1"), ...visit("S5")], { rounds: 1 });
    expect(still.winner).toBeNull();
    expect(still.contenders).toEqual([0, 2]);

    const again = [...tied, ...visit("S5"), ...visit("S1"), ...visit("S5")];
    expect(play([...again, ...visit("S7")], { rounds: 1 }).winner).toBeNull();
    expect(play([...again, ...visit("S7"), ...visit("S1")], { rounds: 1 }).winner).toBe(0);
  });

  it("replays a correction that changes the winner", () => {
    const events: MatchEvent[] = [start(), dart("T20", "a"), takeout, ...visit("S20")];
    expect(play(events, { rounds: 1 }).winner).toBe(0);

    events.push({ type: "DartCorrected", dartId: "a", segment: seg("S1") });
    expect(play(events, { rounds: 1 }).winner).toBe(1);
  });

  it("refuses a rules version it doesn't know", () => {
    expect(() => play([start()], { rulesVersion: 2 })).toThrow();
  });
});
