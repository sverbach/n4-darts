import {
  defaultX01Settings,
  type MatchEvent,
  matchState,
  type Segment,
  type X01Settings,
} from "@n4/engine";
import { describe, expect, it } from "vitest";
import { CALL_KEYS, callsFor } from "./callouts.ts";

let nextId = 0;

function seg(name: string): Segment {
  if (name === "M") return { number: 0, multiplier: 0 };
  if (name === "BULL") return { number: 25, multiplier: 2 };
  const multiplier = ({ S: 1, D: 2, T: 3 } as const)[name[0] as "S" | "D" | "T"];
  return { number: Number(name.slice(1)), multiplier };
}

const start: MatchEvent = { type: "MatchStarted", playerCount: 2 };
const dart = (name: string): MatchEvent => ({
  type: "DartThrown",
  dartId: `d${++nextId}`,
  segment: seg(name),
});
const takeout: MatchEvent = { type: "TakeoutFinished" };
const undo: MatchEvent = { type: "VisitUndone" };

function calls(before: MatchEvent[], added: MatchEvent[], settings: Partial<X01Settings> = {}) {
  const s = { ...defaultX01Settings, ...settings };
  return callsFor(matchState(s, before), matchState(s, [...before, ...added]));
}

const visit = (...names: string[]) => [...names.map(dart), takeout];

describe("callsFor", () => {
  it("calls the visit's score at takeout", () => {
    const before = [start, dart("T20"), dart("S20"), dart("S5")];
    expect(calls(before, [takeout])).toEqual(["85"]);
  });

  it("calls one hundred and eighty", () => {
    expect(calls([start, dart("T20"), dart("T20"), dart("T20")], [takeout])).toEqual(["180"]);
  });

  it("calls no score for a visit of misses", () => {
    expect(calls([start, dart("M"), dart("M"), dart("M")], [takeout])).toEqual(["0"]);
  });

  it("calls a visit ended early with fewer darts", () => {
    expect(calls([start, dart("S20")], [{ type: "VisitEndedManually" }])).toEqual(["20"]);
  });

  it("makes no call for a dart that doesn't end the visit", () => {
    expect(calls([start, dart("T20")], [dart("T20")])).toEqual([]);
    expect(calls([start, dart("T20"), dart("T20")], [dart("T20")])).toEqual([]);
  });

  it("calls a bust on the dart, and nothing more at takeout", () => {
    const settings = { startScore: 40 };
    expect(calls([start, dart("S20")], [dart("T20")], settings)).toEqual(["busted"]);
    expect(calls([start, dart("S20"), dart("T20")], [dart("S1")], settings)).toEqual([]);
    expect(calls([start, dart("S20"), dart("T20")], [takeout], settings)).toEqual([]);
  });

  it("calls game shot on the checkout dart when the leg is won", () => {
    const settings = { startScore: 40, legsToWin: 2 };
    expect(calls([start, dart("S20")], [dart("S20")], settings)).toEqual(["gameshot"]);
    expect(calls([start, dart("S20"), dart("S20")], [takeout], settings)).toEqual([]);
  });

  it("calls game shot and the match when the checkout wins the match", () => {
    const settings = { startScore: 40 };
    expect(calls([start, dart("S20")], [dart("S20")], settings)).toEqual(["matchshot"]);
    expect(calls([start, dart("S20"), dart("S20")], [takeout], settings)).toEqual([]);
  });

  it("still calls the outcome when the dart and the takeout arrive together", () => {
    expect(calls([start, dart("S20")], [dart("S20"), takeout], { startScore: 40 })).toEqual([
      "matchshot",
    ]);
    expect(calls([start, dart("S20")], [dart("T20"), takeout], { startScore: 40 })).toEqual([
      "busted",
    ]);
  });

  it("makes no call for a correction", () => {
    const before = [start, dart("T20"), dart("S20"), dart("S5")];
    const dartId = `d${nextId}`;
    const corrected: MatchEvent = { type: "DartCorrected", dartId, segment: seg("S1") };
    expect(calls(before, [corrected])).toEqual([]);
    expect(calls([...before, takeout], [corrected])).toEqual([]);
  });

  it("makes no call for an undo", () => {
    expect(calls([start, ...visit("T20", "T20", "T20")], [undo])).toEqual([]);
    expect(calls([start, dart("T20")], [undo])).toEqual([]);
  });

  it("makes no call before the match starts or when it starts", () => {
    expect(calls([], [start])).toEqual([]);
    expect(callsFor(null, matchState(defaultX01Settings, [start, ...visit("S20")]))).toEqual([]);
  });

  it("knows a key for every call", () => {
    expect(CALL_KEYS).toHaveLength(184);
    expect(CALL_KEYS).toContain("180");
    expect(CALL_KEYS).toContain("busted");
  });
});
