# Adding a dart the board missed

Status: done
Type: task

Now and then Autodarts doesn't detect a dart, e.g. it registers darts 1 and 2 but not 3. Players can only correct darts that were detected, so the missed one can't be entered. They need to add it by hand on the station.

## Decisions

- **Where.** On `/station/n`, while a visit has fewer than 3 darts, the next empty dart slot shows "+ Add". Tapping it opens the segment picker (the same one as for corrections, titled "Add dart 3"). The picked dart is added to the visit as if the board had seen it. No PIN, like corrections.
- **Which slot.** Only the next one in order. If the board missed dart 2 but saw dart 3, the added dart still goes last. That only matters for a checkout, and the players can correct the values to put them right.
- **Event.** The usual `DartThrown`, marked `source: "manual"`, without board coordinates. It counts like any other dart in scores, checkouts and stats. Undo and correcting work on it as usual.
- **With the board.** Once the visit has 3 darts it waits for takeout as usual. The board still sees only 2 darts on it, but pulling them is reported as a takeout all the same, so the visit ends normally. If the board later detects the missed dart after all, that becomes a 4th dart, which is ignored.
- **After a server restart.** The board sync mustn't take an added dart for a pulled one: its check of "are the logged darts still on the board" skips manual darts, which have no coordinates. A test covers this.
- **Elsewhere.** `/watch` and `/display` show the dart like any other. Match detail in `/admin` marks added darts subtly, e.g. "added". Adding darts to past visits from `/admin` is out of scope for now: corrections there cover most cases, and "Undo" on the station handles a mistake noticed right away.
- **Simulator.** It gets a way to drop a dart on purpose (detect nothing) for testing.

## Acceptance

- Tested in the engine and station: adding darts 1–3 by hand, a checkout and a bust with an added dart, takeout afterwards, a late board detection being ignored, and a restart mid-visit.
- Checked in the browser at 390 px and 1440 px against the simulator.

## Comments

2026-10-22: Done; proposal confirmed by the user as written.
- **Server:** new station command `addDart { segment }`, allowed while the visit is being thrown and has fewer than 3 darts. It appends a `DartThrown` with `source: "manual"` and no coordinates. Segments are now validated for `correctDart` as well (`isSegment` moved into the engine).
- **Restart sync:** only compares darts with coordinates against the board.
- **Takeout from an empty board:** found while testing. The board only reports a takeout when its count of detected darts drops, so a visit whose darts were all added by hand wouldn't end on takeout.
  - The gateway now also reports "Takeout finished" from an empty board.
  - The station ignores a takeout for a visit without darts, which would otherwise skip the player.
  - Whether the real board reports a takeout when it has detected nothing is unverified. If it doesn't, "Next player" still works.
- **Admin:** `MatchDetail.added` lists the added darts; match detail marks them "added" with a dashed border.
- **Simulator:** a "Missed dart" button (`POST /sim/miss`). The dart is on the board but isn't reported, and takeout still sees it.
- **Tests:** station tests for adding with a late detection and takeout, all 3 darts added, a bust, a checkout, refusals, and a restart mid-visit. Also a gateway test and a sim test.
- **Browser:** checked at 390 and 1440 against the simulator. The flow ends at 501 → 362, and the turn passes to the next player.
