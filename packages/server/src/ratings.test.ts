import { defaultX01Settings, type MatchEvent } from "@n4/engine";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.ts";
import { type Db, openDb } from "./db.ts";
import { ratingOf } from "./ratings.ts";

let db: Db;
afterEach(() => db?.close());

let matchNo = 0;
/** A closed Ann vs Bob match in which Ann throws one visit of the given darts. */
function match(annDarts: [number, 1 | 2 | 3][], options: { abandoned?: boolean } = {}) {
  const id = `m${++matchNo}`;
  db.createMatch({ id, station: null, settings: defaultX01Settings, playerIds: ["ann", "bob"] });
  const events: MatchEvent[] = [
    { type: "MatchStarted", playerCount: 2 },
    ...annDarts.map(
      ([number, multiplier], i): MatchEvent => ({
        type: "DartThrown",
        dartId: `${id}-${i}`,
        segment: { number, multiplier },
      }),
    ),
    { type: "TakeoutFinished" },
  ];
  for (const event of events) db.append(id, event);
  db.closeMatch(id, options);
}

function setup() {
  db = openDb(":memory:");
  db.addPlayer({ id: "ann", name: "Ann", archived: false });
  db.addPlayer({ id: "bob", name: "Bob", archived: false });
}

describe("rating", () => {
  it("is null for a player without completed matches", () => {
    setup();
    expect(ratingOf(db, "ann")).toBeNull();
  });

  it("is the 3-dart average over completed matches, leaving out abandoned ones", () => {
    setup();
    match([
      [20, 3],
      [20, 1],
      [20, 1],
    ]); // 100 in 3 darts
    match([
      [20, 1],
      [20, 1],
      [20, 1],
    ]); // 60 in 3 darts
    match(
      [
        [20, 3],
        [20, 3],
        [20, 3],
      ],
      { abandoned: true },
    );

    expect(ratingOf(db, "ann")).toBe(80);
    expect(ratingOf(db, "bob")).toBeNull();
  });

  it("only counts the last 10 completed matches", () => {
    setup();
    match([
      [20, 3],
      [20, 3],
      [20, 3],
    ]); // the oldest: 180, falls out
    for (let i = 0; i < 10; i++)
      match([
        [20, 1],
        [20, 1],
        [20, 1],
      ]);

    expect(ratingOf(db, "ann")).toBe(60);
  });

  it("shows in the admin player list", async () => {
    setup();
    match([
      [20, 1],
      [20, 1],
      [20, 1],
    ]);
    const players = (await buildApp({ db }).inject("/api/admin/players")).json();

    expect(players).toEqual([
      { id: "ann", name: "Ann", archived: false, photo: null, rating: 60 },
      { id: "bob", name: "Bob", archived: false, photo: null, rating: null },
    ]);
  });
});
