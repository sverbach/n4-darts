# Routes with wouter instead of hand-written regexes

Status: done
Type: task

`packages/web/src/App.tsx` picks the page with a chain of regexes on `window.location.pathname` (`/^\/station\/(\d+)\/?$/` and so on). It works, but it's hard to read and easy to get wrong when a route is added. Replace it with [wouter](https://github.com/molefrog/wouter): small (about 2 KB), hooks-based, widely used, with typed route params. No behaviour changes.

## Decisions

- **wouter, not React Router or TanStack Router.** Eight routes, no data loading per route, no nested layouts: wouter covers it at a fraction of the size. (Chosen with the user, 2026-10-31.)
- **Full page loads stay.** Links remain plain `<a href>`; the router only decides which page renders. Client-side `Link`s are a possible later ticket, since they change how pages mount and how live streams reconnect.
- **Version.** The latest wouter release that's at least two weeks old, pinned exactly in `packages/web/package.json`, like the other dependencies.
- **Routes**, all as today:

| Path | Page |
|---|---|
| `/` | Home |
| `/station/:id` | `StationPage` (`id` a number) |
| `/watch/:id` | `WatchPage` (`id` a number) |
| `/display` | `DisplayPage` |
| `/players` | `LeaderboardPage` |
| `/players/:id` | `ProfilePage` (`id` URL-decoded, as today) |
| `/admin` and `/admin/:section` | `AdminPage`, `section` defaulting to `tournament`; an unknown section falls through to Home, as today |

- **Same edge cases.** A trailing slash still matches (`/display/`), a non-numeric station id (`/station/x`) still falls through to Home, unknown paths still show Home. Write these down as tests before switching.
- **Where it lives.** The route table stays in `App.tsx` (it's the app's wiring). Pages keep receiving `id` / `section` as props, so no feature changes.

## Acceptance

- `App.tsx` has no regexes and no `window.location`; the routes read as a table.
- A unit test (Vitest, `packages/web`) renders `App` at each path above, plus `/display/`, `/station/x`, `/admin/nope` and `/nope`, and checks which page comes up. Written first, against today's regexes, so it proves the switch changes nothing. If rendering the pages pulls in too much (live streams), stub the pages in the test.
- The browser tests pass unchanged, and every page still loads in the dev server against the simulator, at 390 and 1440 px.
- All checks pass (types, lint, tests, load test, browser tests, build). Bundle size before/after noted in the comments.
- **Architecture docs updated:** `docs/architecture/05-building-block-view.md` (5.2, white box web app) says routing is wouter in `App.tsx`; `docs/architecture/04-solution-strategy.md` (4.1 Stack) lists it.

## Comments

2026-10-31: Confirmed by the user.

2026-10-31: Built. `wouter@3.13.0` (30 Sep, exact pin). `App.tsx` is a `Switch` of `Route`s; station and watch ids must be digits (else home, as before), `/admin/:section?` defaults to `tournament` and an unknown section shows home.
- `App.test.tsx` (the web package's first unit test): renders `App` to a string at 17 paths with the pages stubbed, including `/display/`, `/station/x`, `/station/1/more`, `/players/Ann%20B`, `/admin/nope`, `/nope`. Written first and passing against the old regexes; passes unchanged after the switch; fails when the number check is removed. No jsdom: `renderToString` with wouter's `ssrPath`.
- wouter already decodes params and accepts a trailing slash, so neither needs code of ours.
- Every page loaded in Chromium against the dev server at 390 and 1440 px, edge cases included, no console errors. All checks pass.
- JS bundle: 315.66 kB → 321.16 kB (gzip 91.95 → 94.18 kB), +2.2 kB gzipped.
- Docs: 5.2 (web white box) and 4.1 (stack).
