# Server load test: a long match doesn't get slower

Status: ready-for-agent
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
