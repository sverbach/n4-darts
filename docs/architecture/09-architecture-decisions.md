# 9. Architecture decisions

## 9.1 Architecture decision records

The decisions that are hard to reverse, each with its context and consequences:

| ADR | Decision |
|---|---|
| [0001](../adr/0001-autodarts-for-detection-only.md) | Autodarts for dart detection only, via the Board Manager's local API |
| [0002](../adr/0002-match-state-from-event-log.md) | Match state is rebuilt from an append-only event log in SQLite |
| [0003](../adr/0003-visit-ends-at-takeout.md) | A visit ends when the darts are taken out, not at the third dart |
| [0004](../adr/0004-no-logins-stations-are-urls.md) | No logins: stations are URLs, admin is behind a shared PIN |
| [0005](../adr/0005-fully-offline.md) | Everything works with the internet unplugged |
| [0006](../adr/0006-typescript-end-to-end.md) | TypeScript end to end, with the game engine as a shared package |
| [0007](../adr/0007-no-client-state-library.md) | No client state library: server data is pushed live, or read once |
| [0008](../adr/0008-public-read-only-site.md) | A read-only public site, behind one shared password |
| [0009](../adr/0009-wled-json-api-fire-and-forget.md) | Lights through WLED's JSON API, fire-and-forget |
| [0010](../adr/0010-requests-parsed-with-zod-at-the-routes.md) | Requests are parsed with Zod at the routes |
| [0011](../adr/0011-live-views-over-websockets.md) | Live views over WebSockets |
| [0012](../adr/0012-party-modes-persisted-never-counted.md) | Party modes are persisted, but never counted |

## 9.2 Decision log

The smaller decisions, as they were settled. Requirements marked "arch" in section 1.1 come from here. Where a later entry or section 1.1 says otherwise, the later one counts.

Settled in discussion (2026-10-18), then per feature. The hard-to-reverse ones are the ADRs above; terms are defined in `GLOSSARY.md`. Details of each feature are in its spec under `.scratch/`.

- **Laptops run nothing of ours**: only Board Manager and a kiosk browser. The server connects to the boards directly.
- **Stack**: TypeScript end to end, one Docker image.
- **Game**: X01 only for v1, default 301 (party modes came later, see below). Default single in / single out; in and out rules configurable (e.g. double out, bull in). Starting score and legs are settings.
- **Tournament shape**: always a group phase (default round robin), then single or double elimination (default double).
- **Visit boundary**: a visit ends when the player takes their darts out (`TakeoutFinished`), not at the 3rd dart, bust or checkout.
- **Throwing order**: each match has a fixed player order; the leg starter moves one place along it every leg (with two players: alternates).
- **Stray darts** (wrong player, idle station): ignored.
- **No referee role**: players correct their own darts at the station; every correction is logged and the organiser can override.
- **Players are persistent** across evenings: long-term stats build player profiles and feed seeding for future tournaments.
- **Input**: laptop at the station, and the UI must be mobile friendly so phones work as well.
- **Groups**: default is a single group (everyone plays everyone); the organiser may pick more. Multiple groups are snake-seeded by rating. Win = 2 points; ties broken by leg difference, head-to-head, then 3-dart average. Top N per group advance.
- **KO seeding**: group winners spread across the bracket, runners-up crossed (A1 vs B2); byes go to the top seeds.
- **Double elimination**: grand final with bracket reset by default, configurable.
- **Legs per phase**: groups / winners / losers / final each have their own best-of setting.
- **Leg 1 throw**: players set the order at the station before starting (reorder or shuffle); bull-off detection is a later feature.
- **Matches with 2–8 players** outside tournaments (`/admin` and quick matches); tournament matches stay one against one. A leg ends at the first checkout; the setting is "first to N legs". No teams.
- **Board reset pressed on the laptop**: the logged darts stand, no prompt. Mid-visit the visit carries on with the next darts; when the visit is already over (waiting for takeout) the reset ends it, since the cleared board won't see a takeout. "Undo" and "next player" are there if needed.
- **Stations are URLs**: any number of devices may control `/station/n` at once; `/watch/n` is view-only.
- **Manual "next player"** button ends a visit if takeout isn't detected, and resets the board.
- **Scheduling**: a free board gets the next match whose players are both free, longest-rested first; the KO starts when the group phase is complete; the organiser can override.
- **`/admin`** is protected by a shared PIN from server config.
- **Rating / seeding**: 3-dart average over the last 10 matches; new players unseeded; the organiser can override.
- **Duration estimate** shown when creating a tournament (player count × legs per phase × average leg length, learned from history). Group default: best of 1.
- **Advancing**: with one group everyone advances by default; top N configurable.
- **Withdrawals**: unplayed matches become walkovers (2 points, N–0 legs) and played results stand; walkovers don't count for long-term stats. Free roster edits until the first match is played.
- **Station corrections**: darts of the current visit, plus "undo last visit". Older changes go through `/admin`.
- **Later, not v1**: free play / quick match (data model allows a match without a tournament from day one), sound caller, bull-off detection.
- **Frontend**: React + Vite. Visual language from the Design canvas "n4darts — Station View" (see "Design system" below).
- **Board simulator**: a fake Board Manager (same API, replays recorded logs or is driven from a clickable board) is built alongside the gateway and used for automated tests.
- **Repo layout**: pnpm workspace with `packages/engine`, `packages/server`, `packages/web`, `tools/board-sim`. Single domain context.
- **Stations** are configured in `/admin` (name + Board Manager address) with a live connection indicator. Laptops get DHCP reservations.
- **Fully offline assets**: no CDN, fonts or icons from the internet.
- **Backups**: nightly SQLite copy, keep 30 (no download button for now).
- **Displays**: no separate TV view needed beyond what the projector shows: the tournament tree, and sometimes a station screen in view-only mode.

### Tournaments and the scheduler (2026-10-18)

Details in `.scratch/tournaments/spec.md`.

- **One active tournament at a time**; quick and single matches still work alongside, on free stations.
- **Rating**: 3-dart average over the last 10 completed matches of any kind (no abandoned matches, no walkovers); unseeded players go last in a random, changeable order.
- **Station hand-over**: a finished tournament match frees its station on Done or 60 s after the checkout.
- **Overrides**: pause a station, pin a match to a station, hold a match, send a match back to the queue, play a match now.
- **Ties** after head-to-head: a mini table of the tied players' mutual matches, then this tournament's group average, then the higher seed.
- **Knockout**: next power of two with byes for the top seeds; group winners, then runners-up, crossed; standard double elimination; no third-place match.
- **Result changes** in `/admin` must keep a winner; what depends on a result is rebuilt while it hasn't started, otherwise the correction is refused.
- **Withdrawals** turn every remaining match into a walkover; **late arrivals** may join during the group phase only.

### Display and stats (2026-10-20)

Details in `.scratch/display-and-stats/spec.md`.

- **Live updates** everywhere (Server-Sent Events then, WebSockets since ADR 0011): every database write and station change triggers a recompute, and a view is only sent when it changed. No polling left.
- **`/display`**: a fixed split, scaled to fit any screen, no rotating pages. Now playing (live scores) and Up next beside the group tables or the bracket; afterwards the champion, placings and awards; with no tournament, the stations and the top 10. It never switches to a station by itself.
- **`/watch/n`**: the station's scoreboard without controls, linked from `/display` and the home page.
- **Stats** over every completed match of any kind (no walkovers, no abandoned matches), computed from the event log and cached per match until it changes. Public leaderboard (`/players`) and profiles (`/players/<id>`). A match's evening is the day it started, shifted 6 h so a night past midnight counts to the day it began. Checkout % counts darts at a one-dart finish in double-out matches.
- **Awards** for a tournament finished with a champion: best match average, highest checkout, most 180s, best leg; ties shared, empty categories left out.
- **Backups** at start when the last is over a day old, then whenever a day has passed; 30 kept in `DATA_DIR/backups`.
- **Later**: head-to-head between two players, filtering stats by game.

### Board menu and photos (2026-10-20)

Details in `.scratch/board-menu-and-photos/spec.md`.

- **Board menu** on every station page (no PIN) and in `/admin` → Stations: stop/start detection, auto-calibrate, reset. A reset from the menu behaves like one pressed on the laptop. The board status distinguishes online, stopped and offline.
- **Player photos** live in SQLite (so they're in the backups), uploaded by the organiser only, cropped and shrunk to a 512×512 JPEG in the browser; served by a versioned URL that can be cached forever. Players without a photo get initials on a colour of their own.

### Design system (2026-10-21)

Details in `.scratch/design-system/spec.md`. The look, theming, styles and projector scaling are described in [section 8.6](08-crosscutting-concepts.md#86-user-interface-and-design-system).

### Input validation (2026-11-04)

Details in `.scratch/input-validation/spec.md`.

- **Zod at the routes** (ADR 0010): every request is parsed before the logic sees it; schemas in `api.ts`, types derived from them; a 400 with a readable message for what doesn't fit.
- **Stricter than before:** unknown fields, booleans and numbers sent as text, and an unknown `?view=` are refused instead of coerced. `paused`, `held` and a pin's `station` are required.
- **Segments:** only what a board can report. 1–20 as single, double or treble; 25 as single or double; a miss is multiplier 0 with a number 0–20 (the nearest segment, or 0 for a bounce-out).

### Live views over WebSockets (2026-11-05)

Details in `.scratch/live-websockets/spec.md`.

- **WebSockets instead of Server-Sent Events** (ADR 0011): a proxy can't buffer them, and they don't use up the browser's six HTTP/1.1 connections, the two ways SSE had slowed the app down.
- **One socket per view**, server to client only, on the same `/live` URLs; changes stay HTTP requests.
- **Refusals close with 4000 + the HTTP status** (4401 without the admin PIN); the client gives up on those and reconnects after anything else, 500 ms doubling to 5 s.
- **Proxies must forward WebSockets** (OPS-04).

### Party modes (2026-11-06)

Details in `.scratch/party-modes/spec.md`.

- **Five party modes** beside X01: Around the Clock, Golf, High Score, Killer and Cricket. One game per match, 2–8 players, started from the station's quick match (or `POST /api/admin/matches`).
- **Persisted, never counted** (ADR 0012): same tables and event log as X01; finished party matches are left out of every stat and list, and never in tournaments.
- **One engine entry point:** `matchState(settings, events)` folds by `settings.mode`. Party modes share their turn order (`playParty`) and, where they have rounds and a tie-break, `playRounds` (High Score, Golf, Cricket).
- **Ties go to sudden death** between the tied leaders: one more visit (or hole) each in High Score and Golf, a visit at the bull in Cricket after its 20-round cap.
- **Calls:** only the match shot, plus visit scores in High Score. **Lights:** match start and game shot, plus 180 in High Score.
- **Board first:** where a mode has a target (Around the Clock, Golf, Killer, Cricket), the target board is the main element of the station and `/watch`, with the players (or Golf's scorecard, Cricket's marks grid) beside it.

### Build order (done)

All six steps are done (as of 2026-10-21).

1. **Gateway + engine spike**: server connects to one board and plays a 301 leg end to end on a bare `/station/1` page.
2. Corrections + crash recovery (event log).
3. Players + single match created from `/admin`, assigned to a station.
4. Tournament formats + scheduler for two stations.
5. `/display` projector view, long-term stats and seeding.
6. Design system styling across all pages.
