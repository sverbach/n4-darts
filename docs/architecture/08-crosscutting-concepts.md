# 8. Cross-cutting concepts

## 8.1 Domain language

The terms (station, board, visit, takeout, leg, rating, seed, walkover…) are defined once in [`GLOSSARY.md`](../../GLOSSARY.md) and used the same way in code, UI and docs.

## 8.2 Event log and rules versions

A match is its log (ADR 0002). Darts, corrections, added darts, undo and manual "next player" are all events; the state is folded from them by the engine. Corrections are appended, never written over, so the original detection stays visible (PLAY-09, MATCH-05). Each match records the rules version it was played under, so a rule change never changes an old result (PLAY-17). Stats, ratings and tournament results are derived from the logs and cached per match until the log changes (STATS-07).

## 8.3 Live updates

Every screen except the stats pages updates by itself (VIEW-01). One change feed (`live.ts`) hears every database write and every station's view change, settles a burst into one call per event-loop turn, and each Server-Sent Events stream recomputes its view and sends it only when it differs from the last one. The browser side is one hook, `useLive`. Any number of devices can follow or control a station at once (VIEW-06).

## 8.4 Access

No logins for players (ADR 0004). Everything at the station works without a PIN: quick match, adding a player, corrections, the board menu (ADMIN-02). The organiser's area (`/admin`, `/api/admin/*`) is behind a shared PIN, asked once per device and remembered for 30 days in a signed cookie (ADMIN-01). It stops accidental edits by guests, not attackers (Q-12).

## 8.5 Offline

Nothing is loaded from outside the room at runtime: fonts, icons and the logo are bundled, and nothing calls out to the internet (ADR 0005, Q-01). Player photos are stored in SQLite, so they're in the backups (Q-13).

## 8.6 User interface and design system

Details in `.scratch/design-system/spec.md`; mockups in the Design canvas https://claude.ai/artifact/HuW84FFVzNBsw7FVAXfy7b.

- **Look**: retro terminal. Silkscreen (labels, names, buttons, in capitals) and Geist Pixel (numbers, text), both bundled. Near-black grounds, violet accent, green/amber/red for status. No rounded corners, slanted primary buttons, pixel icons (`PixelIcon`), octagon avatars, the logo as inline SVG (`Logo`).
- **Theming**: dark only for now, but every colour is a role-named CSS variable in `styles/tokens.css`. A theme only redefines those, so components never hard-code a colour.
- **Tailwind** (being introduced, `.scratch/tailwind/`): `styles/theme.css` makes the tokens Tailwind's theme, so components use roles (`bg-surface`, `text-accent`, `font-pixel`) and a theme still only changes `tokens.css`. Tailwind's own colours, fonts and breakpoints are cleared; the one breakpoint is `kiosk:` (760 px). Classes are sorted by Biome (`useSortedClasses`; it puts the custom `kiosk:` variant first, which is harmless). Conditional classes stay template strings, no `clsx`. Until the old sheets are gone, Tailwind's reset (preflight) is left out and its layers lose to the old, unlayered sheets: a border therefore needs `border-0` before a side (`border-0 border-t border-solid`), or the other sides get the browser's 3 px default.
- **Styles**: `styles.css` imports Tailwind's theme and utilities, `theme`, `tokens` and `app` (element defaults in Tailwind's base layer; the shared pieces as utilities of their own: `label`, `hint`, `match-label`, the button variants `primary` / `cta` / `ghost` / `danger`, `status` with `status-ok` / `-warn` / `-danger` / `-accent`, `error`, `notice`, `panel`, `settings`, `group-table`, `table-scroll`, `back`, `inline-form`, `avatar-frame`; the logo's keyframes), then the page sheets not yet migrated: `station`, `display`, `pages` and `admin`. Components (`components/`) use utilities in their markup. Two layouts per page, switching at 760 px; the kiosk laptop gets the wide one.
- **Projector**: `/display` and `/watch` size everything from `--px`, one pixel of the 1920×1080 or 1280×720 mockup, so every screen shows the same layout.

Pages and their layouts are described in `docs/ui-pages.md`.

## 8.7 Testability

- **Pure cores:** the engine (rules, checkouts, stats) and the tournament plan (groups, tables, knockout) are tested without any I/O (Q-14).
- **Board simulator:** `tools/board-sim` speaks the Board Manager's protocol and can throw, revise, miss darts, take out, reset and go offline; the server's integration tests and a full tournament test run against it.
- **Load test:** 600 darts with 200 past matches in the history must stay under the responsiveness budget (Q-05, Q-06).
- **Browser tests:** Playwright drives the web app against the server on simulators, at phone and desktop width.
- **Visual suite:** every page and state as a screenshot, compared at zero tolerance with a committed baseline (`packages/e2e/tests/visual.spec.ts`). Run by hand around style changes, not in CI.
- **Where tests live:**
  - **Unit and component tests** sit next to the file they test (`players/players.test.ts`), also when they go through the whole app with `buildApp`.
  - **`packages/server/src/testing/integration/`**: tests of several components working together (the app's wiring, organiser overrides, result changes, withdrawals).
  - **`packages/server/src/testing/load/`**: the load test. **`testing/e2e/`**: a whole tournament evening on simulated boards, through a server restart. **`testing/seed.ts`**: a realistic match history for tests that need one.
  - **`packages/e2e/`**: the browser tests.
- **CI** runs all of it on every push; nothing ships that fails (Q-15).

## 8.8 Operations

- **Backups:** at start if the newest is over a day old, then daily; the newest 30 are kept in `DATA_DIR/backups` (OPS-01).
- **Diagnostics:** `/admin/diagnostics` shows event-loop delay, open live connections, view and write timings, board connections and the board-to-screen time of the last 20 darts. Counting is always on and costs next to nothing; the heavier timings only run while someone has had the page open in the last two minutes (OPS-03, Q-17).
