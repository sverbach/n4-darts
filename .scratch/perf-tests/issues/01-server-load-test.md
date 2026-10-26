# Server load test: a long match doesn't get slower

Status: done
Type: task

On 2026-10-21 darts showed up later and later during a match. That turned out to be the proxy (see `live-behind-proxy`), but nothing stops the app itself from developing the same symptom: each dart folds the whole event log, and every live stream recomputes its view on each change. A test in CI should catch that before it ships.

## In scope

- **Where.** A Vitest test in `packages/server` (e.g. `src/load.test.ts`), with no new framework. It runs in-process against the board simulator, like `station.test.ts`.
- **Setup.** One station, a long quick match (e.g. 701, double out, first to 5 legs), with the station stream plus `/api/display/live`, `/api/stations/live` and `/api/admin/tournament/live` open. A variant also runs it as a tournament match, so the tournament views recompute too.
- **What it measures.** About 1,000 darts thrown through the simulator, with a takeout after every visit. For each dart: the time from the simulator throw to the station stream's message.
- **When it fails.** CI runners are noisy, so it doesn't compare against fixed millisecond limits alone:
  - **Growth:** the median of the last 100 darts is at most 2× the median of the first 100.
  - **Ceiling:** a loose limit to catch disasters, e.g. 95th percentile under 250 ms and nothing over 1 s.
  - **Work per dart:** one database write per dart, and each stream sends at most one message per change. These counts don't depend on machine speed, so they're the most reliable signal.
- **Report.** On failure, the test prints the medians and slowest darts per 100-dart block, so the cause is visible from the CI log.
- **Run time.** Under 30 s locally. If it's slower, throw fewer darts rather than skipping it in CI.

## Acceptance

- Runs in `pnpm test`, and so in CI on every push.
- Fails when slowness is introduced on purpose, e.g. a 1 ms busy loop per logged event in `matchState`, or a second database write per dart. Note in the comments which of these were tried.
- Passes reliably: 10 runs in a row locally without a flaky failure.

## Comments

2026-10-26: Built as `packages/server/src/load.test.ts`, with a seeder in `src/seed.ts`. Agreed changes to the ticket:
- **History.** Both runs start from a database seeded with 200 finished 701 matches (`seedHistory`), as after a few months of evenings.
- **Failure rules.** Every dart has to reach the station within **150 ms**. The growth rule is relaxed to **4×** (last 100 darts' median against the first 100), with medians under 2 ms counted as noise. The 250 ms p95 and 1 s ceiling are gone. The work counts stay: one write per dart or takeout, at most one message per stream per change.
- **600 darts, not 1,000**, to stay under 30 s (about 22 s locally). A run stops at the first dart over 150 ms.

**What it found, and the fix.** With history in the database, every tournament view (display and admin, on every dart) replayed up to 500 past matches for the duration estimate's minutes per leg: about 200 ms per view at 500 matches. Now:
- Each match's leg durations are worked out once and stored in a new `matches.leg_minutes` column. Appending to the log clears it, so a correction gets it measured again.
- The estimate averages over the last 50 matches only.
- Without the fix, the tournament run fails on its first dart (216 ms).

Re-reading tonight's tournament matches for results and legs (about 30 ms per view by the end of a 12-player evening) is left as it is, by decision.

Numbers with history: quick match medians ~3 → 4 ms. Tournament match ~15 → 27 ms, slowest ~40 ms.

Tried on purpose:
- A 1 ms busy loop per logged event in `matchState`: both runs fail at about 12 darts on the 150 ms limit.
- A second write per dart (`setHeld` after each dart): both fail on the write count (1,403 writes for 803 changes).
- The old leg-duration code: the tournament run fails on its first dart (216 ms).

10 runs in a row passed (21–23 s each).
