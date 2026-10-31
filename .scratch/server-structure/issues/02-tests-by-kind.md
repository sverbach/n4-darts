# Sort the server's cross-component tests by kind

Status: ready-for-agent
Type: task
Blocked by: 01

Give the tests that aren't about one component their own place: `packages/server/src/testing/` with `integration/`, `load/`, `e2e/` and the shared `seed.ts`, as in `../spec.md`.

## Steps

- `git mv` into `testing/integration/`: `app.test.ts`, `overrides.test.ts`, `resultChanges.test.ts`, `withdrawals.test.ts`.
- `git mv` into `testing/load/`: `load.test.ts`. Into `testing/e2e/`: `tournament.e2e.test.ts` (it can drop the `.e2e` from its name now the folder says it, e.g. `tournamentEvening.test.ts`).
- `git mv` `seed.ts` to `testing/seed.ts`.
- Fix imports. Vitest picks up `*.test.ts` anywhere, so no config change; check `pnpm test` still runs the same number of tests (455 today).
- Check what names the old paths: the comment in `packages/e2e/tests/latency.spec.ts`, the perf-tests and diagnostics notes in `docs/`, CI.
- Before moving, check each of the four integration tests really spans several components. One that turns out to be about one component goes next to it instead; note it in the comments.

## Acceptance

- `testing/` holds `seed.ts`, `integration/`, `load/`, `e2e/`, and nothing at the top of `src/` is a test.
- `pnpm test` runs all 455 tests (or the new count, with the reason) and passes; the load test still runs in CI.
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Architecture docs updated:** `docs/architecture/08-crosscutting-concepts.md` (8.7 Testability) says where each kind of test lives: unit and component tests next to their file, `testing/integration`, `testing/load`, `testing/e2e`, and the browser tests in `packages/e2e`.

## Comments
