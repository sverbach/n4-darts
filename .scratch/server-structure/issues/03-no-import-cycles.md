# The linter keeps imports free of cycles

Status: done
Type: task
Blocked by: 01

Server components depend on each other, but one way only (the one-way-dependencies tickets). Make that hold by itself: Biome's `noImportCycles` at level `error`, so `pnpm lint` and CI fail on an import cycle.

## Decisions

- **Whole repo, not just the server.** It passes today for engine, server and web (checked with `biome lint --only=suspicious/noImportCycles`), and a cycle is a smell anywhere.
- **Type-only imports count too** unless that makes legitimate code fail. If Biome flags a `import type` loop that's harmless, decide whether the rule's options can ignore type imports, and write down which way it went.
- **Proven both ways.** Add a cycle on purpose (e.g. `players.ts` importing from `matches.ts`, which already imports `players.ts`), see `pnpm lint` fail, remove it.

## Acceptance

- `biome.json` has `suspicious/noImportCycles` at `error`.
- `pnpm lint` fails on a deliberate cycle and passes on the code as it is.
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Architecture docs updated:** `docs/architecture/02-architecture-constraints.md` (2.3 Conventions) and `docs/architecture/05-building-block-view.md` (5.2, white box server) say dependencies are one-way and that the linter enforces it.

## Comments

2026-10-31: Confirmed by the user as written.

2026-10-31: Built. `biome.json`: `suspicious/noImportCycles` at `error` with `ignoreTypes: false`.
- Biome ignores `import type` loops by default (`ignoreTypes` defaults to true, since the compiler removes them). Counting them passes on today's code, so the stricter setting is on: a type-only loop is still a two-way dependency between components.
- Proven both ways with `players.ts` importing from `matches.ts` (which imports `players.ts`): a value import and an `import type` both fail `pnpm lint`; removed, it passes.
- All checks pass. Docs: 2.3 Conventions and 5.2 (white box server) say dependencies are one-way and the linter enforces it.
