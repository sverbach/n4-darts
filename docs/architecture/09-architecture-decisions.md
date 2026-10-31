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

## 9.2 Decision log

The smaller decisions, as they were settled. Requirements marked "arch" in section 1.1 come from here. Where a later entry or section 1.1 says otherwise, the later one counts.

Settled in discussion (2026-10-18), then per feature. The hard-to-reverse ones are the ADRs above; terms are defined in `GLOSSARY.md`. Details of each feature are in its spec under `.scratch/`.

- **Laptops run nothing of ours**: only Board Manager and a kiosk browser. The server connects to the boards directly.
- **Stack**: TypeScript end to end, one Docker image.
- **Game**: X01 only for v1, default 301. Default single in / single out; in and out rules configurable (e.g. double out, bull in). Starting score and legs are settings.
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

- **Live updates** everywhere as Server-Sent Events: every database write and station change triggers a recompute, and a view is only sent when it changed. No polling left.
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

### Build order (done)

All six steps are done (as of 2026-10-21).

1. **Gateway + engine spike**: server connects to one board and plays a 301 leg end to end on a bare `/station/1` page.
2. Corrections + crash recovery (event log).
3. Players + single match created from `/admin`, assigned to a station.
4. Tournament formats + scheduler for two stations.
5. `/display` projector view, long-term stats and seeding.
6. Design system styling across all pages.
