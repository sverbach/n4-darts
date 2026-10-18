import { defaultX01Settings } from "@n4/engine";
import { afterEach, describe, expect, it } from "vitest";
import { type Db, openDb } from "./db.ts";
import { defaultLegMinutes, estimateMinutes, legDurations, legMinutes } from "./estimate.ts";
import { defaultTournamentConfig, type TournamentConfig } from "./tournament/types.ts";

describe("estimate", () => {
  const config = (
    patch: Partial<TournamentConfig["format"]>,
    legs = defaultTournamentConfig.legs,
  ) => ({
    ...defaultTournamentConfig,
    format: { ...defaultTournamentConfig.format, ...patch },
    legs,
  });

  it("adds up group and knockout matches, split over the stations", () => {
    // 4 players, one group, single elimination, everything best of 1, 4-minute legs:
    // 6 group matches + 2 semis + 1 final = 9 matches × (4 + 1) minutes.
    const allOne = { groups: 1, winners: 1, losers: 1, final: 1 };
    expect(estimateMinutes(config({ elimination: "single" }, allOne), 4, 4, 1)).toBe(45);
    expect(estimateMinutes(config({ elimination: "single" }, allOne), 4, 4, 2)).toBe(22.5);
  });

  it("counts double elimination with the bracket reset", () => {
    const allOne = { groups: 1, winners: 1, losers: 1, final: 1 };
    // 6 group + 3 winners + 2 losers + 2 final (grand final and reset) = 13 matches.
    expect(estimateMinutes(config({ elimination: "double" }, allOne), 4, 4, 1)).toBe(65);
  });

  it("expects about 75% of the most legs a match can take", () => {
    const bestOf3 = { groups: 2, winners: 2, losers: 2, final: 2 };
    // 3 group matches × (2.25 legs × 4 + 1) + 1 semi... 3 players single: 1 winners match + final.
    const minutes = estimateMinutes(config({ elimination: "single" }, bestOf3), 3, 4, 1);
    expect(minutes).toBeCloseTo(5 * (2.25 * 4 + 1));
  });

  it("has defaults per start score", () => {
    expect([301, 501, 701].map(defaultLegMinutes)).toEqual([4, 6, 8]);
  });
});

describe("leg length from history", () => {
  let db: Db;
  afterEach(() => db?.close());

  /** A finished Ann vs Bob match whose single leg took `minutes`. */
  function legOf(minutes: number, id: string) {
    const start = Date.parse("2026-10-18T19:00:00.000Z");
    const at = (offset: number) => new Date(start + offset * 60_000).toISOString();
    db.createMatch({
      id,
      station: 1,
      settings: { ...defaultX01Settings, startScore: 40 },
      playerIds: ["ann", "bob"],
    });
    db.append(id, { type: "MatchStarted", playerCount: 2 }, at(0));
    db.append(
      id,
      { type: "DartThrown", dartId: `${id}-d`, segment: { number: 20, multiplier: 2 } },
      at(minutes),
    );
    db.closeMatch(id);
  }

  function setup() {
    db = openDb(":memory:");
    for (const id of ["ann", "bob"]) db.addPlayer({ id, name: id, archived: false });
  }

  it("measures each leg from the start (or the previous checkout) to the checkout dart", () => {
    setup();
    legOf(3, "m1");
    expect(legDurations(db, 40)).toEqual([3]);
    expect(legDurations(db, 301)).toEqual([]);
  });

  it("uses the default until there are 5 legs, then their average", () => {
    setup();
    for (let i = 0; i < 4; i++) legOf(2, `m${i}`);
    expect(legMinutes(db, 40)).toBe(defaultLegMinutes(40));
    legOf(7, "m5");
    expect(legMinutes(db, 40)).toBe(3);
  });

  it("ignores legs that took implausibly long", () => {
    setup();
    legOf(90, "m1");
    expect(legDurations(db, 40)).toEqual([]);
  });
});
