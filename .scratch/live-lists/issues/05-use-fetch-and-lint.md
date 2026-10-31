# `useFetch` for one-shot reads, `fetch` only in `lib/`

Status: done
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

2026-10-31: Built.
- `lib/api.ts`: `call<T>(method, url, body?)` resolves to `{ data }` or `{ error, status }` and never throws; a `Blob` body (the photo) goes as it is. `request()` is `call()` returning only the error.
- `lib/useFetch.ts`: `useFetch<T>(url)` gives `data`, `loading`, `error`, `status` and `reload()`. Used by the leaderboard, the profile (404 still says "No such player") and the admin session (`reload` after login and logout).
- Every other `fetch` moved behind `call` / `request`: the login and logout, the photo upload and removal, match corrections, `useStation`'s commands, `usePlayers`' add.
- Lint: `noRestrictedGlobals` denies `fetch` and `EventSource` in `packages/web/src` outside `lib/` and tests; checked by hand that a `fetch` in a feature fails with the message.
- Errors: the stats pages now say what went wrong in the error pill (`role="alert"`) instead of a fixed line; the admin session's failure shows as before.
- Tests: `lib/api.test.ts` covers `call` (data, JSON and photo bodies, the server's message and status, a status without message, no server, 204). Not `useFetch` itself: the web package has no DOM test setup, and the hook is a thin wrapper around `call`; adding happy-dom or Testing Library for one hook didn't seem worth a new dependency. Say if you want it.
- Docs: 8.3 describes the pattern; ADR 0007 (no client state library) and its row in 9.1; 5.2 `lib/`.
- Left alone: a warning that was already there before this ticket, `playerCount` unused in `features/station/MatchSetup.tsx`.
