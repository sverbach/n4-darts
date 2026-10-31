# The linter keeps imports free of cycles

Status: ready-for-agent
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
