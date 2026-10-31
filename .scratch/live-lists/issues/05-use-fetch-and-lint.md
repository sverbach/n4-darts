# `useFetch` for one-shot reads, `fetch` only in `lib/`

Status: ready-for-agent
Type: task
Blocked by: 01, 02, 03, 04

After 01–04, the hand-written fetches left are the stats pages (leaderboard, profile) and the admin session (`AdminPage.tsx`). They handle loading and errors each in their own way: some show an error, some fail silently (`../spec.md`).

## What to do

- `lib/useFetch.ts`: `useFetch<T>(url)` returning the data, a loading state and an error, the same shape `useLive` gives where that fits. A failed request shows the same error everywhere (the `error` pill).
- The stats pages and the admin session use it.
- Lint: `fetch` is allowed only in `lib/` (Biome `noRestrictedGlobals` with an override for `lib/`, next to the existing feature import rules in `biome.json`).
- Unit tests for `useFetch` (success, error, URL change).

## Acceptance

- No `fetch(` outside `packages/web/src/lib/`; the lint rule fails the build if one is added.
- A failed load on the leaderboard, a profile and the admin session shows the error pill instead of an empty page.
- The visual suite passes unchanged.
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Docs:** `docs/architecture/08-crosscutting-concepts.md` (8.3, live views) describes the pattern from `../spec.md` (live with `useLive`, one-shot with `useFetch`, changes with `request()`, `fetch` only in `lib/`); an ADR for "no client state library, server data live over SSE" in `docs/adr/`, pointing at the analysis.

## Comments

2026-10-31: Confirmed by the user.
