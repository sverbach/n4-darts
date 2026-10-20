# Architecture

Status: **agreed high-level design** (2026-10-18). Decisions are listed under "Decisions so far"; the first build step is tracked in `.scratch/walking-skeleton/`.

## Goal

Run private, offline dart tournaments in a room with two Autodarts boards. An organiser sets up a tournament on a local server; the server assigns each match to a board; players walk up and play. No accounts, no logins, no internet.

### Non-goals (for now)

- Replacing Autodarts dart detection.
- Online play, remote players, public access.
- Supporting boards other than Autodarts Board Manager.

## Constraints

- Two stations, each: dartboard + Autodarts 3-cam rig + Windows laptop running Board Manager v2.x.
- Board Manager API (see `board-manager-api.md`): LAN-reachable, unauthenticated, pushes full state snapshots over WebSocket, accepts `start` / `stop` / `reset`.
- Local server: Linux + Docker.
- Everything must keep working with the internet unplugged.

## System overview

```
 Station 1 (laptop)                         Linux server (Docker)
┌──────────────────────┐            ┌─────────────────────────────────────────┐
│ Board Manager :3180  │◀──ws/http──┤  Board Gateway  (1 connection per board) │
│                      │            │        │ domain events  ▲ commands      │
│ Browser kiosk ───────┼──http/ws──▶│        ▼                │               │
│  /station/1          │            │  Match Engine  ◀──▶  Tournament Service │
└──────────────────────┘            │        │                │               │
 Station 2 (laptop)                 │        ▼                ▼               │
┌──────────────────────┐            │   Event store / DB (SQLite)             │
│ Board Manager :3180  │◀──────────┤                                          │
│ Browser /station/2 ──┼───────────▶│  Web app + realtime push (SSE)          │
└──────────────────────┘            └──────────┬──────────────┬───────────────┘
                                               │              │
                                     /admin (phone)      /display, /watch/n (projector)
```

The laptops run nothing of ours: Board Manager (already there) plus a browser in kiosk mode pointing at the server.

## Components

### Board Gateway

One long-lived WebSocket client per board, configured by station → Board Manager address.

- Turns snapshots into domain events by diffing against the last snapshot: `DartDetected(index, segment, coords)`, `DartRevised(index, …)` (if Autodarts changes an earlier dart), `TakeoutStarted`, `TakeoutFinished`, `BoardReset`, `BoardStopped`, `BoardStarted`, `BoardOffline` / `BoardOnline`.
- Sends commands: `start`, `stop`, `reset`.
- Reconnects with backoff; on reconnect fetches `GET /api/state` and re-diffs, so a dropped connection never loses or duplicates a dart.
- Knows nothing about games; it only speaks "board".

### Match Engine

Pure, deterministic game rules. `state = fold(rules, events)`.

- Input events: board darts (via the station's active match), manual corrections, admin actions (`MatchStarted`, `DartCorrected`, `VisitUndone`, `LegForfeited` …).
- Output: current state (scores, whose turn, legs/sets, checkout hints) plus derived facts (`VisitEnded`, `Bust`, `LegWon`, `MatchWon`).
- No I/O, no clock, no DB, so it's trivially testable and can run in the browser too for instant feedback.
- First game: X01 with configurable in/out rules. The rules sit behind an interface so Cricket etc. can follow.
- A visit closes on `TakeoutFinished`. After 3 darts, a bust or a checkout, the engine waits for takeout; further darts before takeout are ignored.

### Tournament Service

- Players (a simple name list, persisted across evenings for stats).
- Tournament = format + players + settings (e.g. 301 straight out, best of 5).
- Generates matches per format: a group phase (round robin), then single or double elimination; advances winners.
- **Scheduler / dispatcher**: keeps a queue of ready matches and assigns the next one to a free station. The organiser can override (swap, pin to a board, pause a station).

### Web app

One frontend, three surfaces, all live via Server-Sent Events from the server:

| Route        | Where                    | Purpose                                                          |
| ------------ | ------------------------ | ---------------------------------------------------------------- |
| `/station/n` | Station laptop or phone  | Upcoming match, "start", live scoreboard, fix last dart, leg/match result |
| `/admin`     | Organiser's phone/tablet | Create tournaments, manage players, override scheduling, fix scores |
| `/watch/n`   | Projector                | View-only mirror of a station                                    |
| `/display`   | Projector                | Tournament tree / group tables, "up next"                        |

### Persistence

SQLite in a Docker volume. Two kinds of data:

- **Event log per match** (append-only): every dart, correction and admin action. Match state is rebuilt from it, which gives crash recovery, an undo/audit trail, and stats for free.
- **Plain tables** for players, tournaments, stations, schedule.

## Key flows

### Playing a match

1. Scheduler assigns match M to station 1 → `/station/1` shows "Next: A vs B", server sends `reset` to board 1.
2. A player presses **Start** at the station → `MatchStarted`.
3. Each `DartDetected` from board 1 is appended to M's log → engine recomputes → all screens update.
4. After 3 darts, a bust or a checkout, the station shows "remove darts" → `TakeoutFinished` closes the visit → next player's turn.
5. `MatchWon` → result goes to the Tournament Service → bracket advances → scheduler gives station 1 its next match.

### Correcting a misdetection

Station shows the current visit's darts; tapping one opens a segment picker → `DartCorrected(index, segment)` is appended. The original detection stays in the log.

### Crash / restart

- **Server restarts**: rebuild every in-progress match from its event log, reconnect gateways, re-sync with `GET /api/state`.
- **Laptop/browser restarts**: the kiosk page reconnects and gets the current state pushed again.
- **Board Manager restarts**: gateway shows the station as offline; play resumes when it's back. Darts thrown meanwhile have to be entered by hand.

## Proposed stack

- **TypeScript end to end**: the engine is shared by server and browser; one language for everything.
- Server: Node + a small HTTP/WebSocket framework (e.g. Fastify or Hono).
- Frontend: a light SPA (React or Svelte), served by the same server.
- DB: SQLite (e.g. via Drizzle or better-sqlite3).
- Packaging: one Docker image, one `docker-compose.yml`, one volume.
- Laptops: Chrome/Edge in kiosk mode, autostarting `http://<server>/station/<n>`.

## Network & trust

- Fixed IPs (DHCP reservations) for both laptops and the server; station → board address lives in server config.
- No player auth. `/admin` gets at most a shared PIN so a guest can't edit the bracket by accident.
- Board Manager is unauthenticated, so anyone on the LAN can reset a board. Accepted for a private room.

## Decisions so far

Settled in discussion (2026-10-18). The hard-to-reverse ones are recorded in `docs/adr/`; terms are defined in `GLOSSARY.md`.

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
- **Frontend**: React + Vite. Visual language follows the user's Claude design system (link to be added).
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

## Open questions

None open. New questions get added here and folded into "Decisions so far" once answered.

## Suggested build order

Steps 1–5 are done (as of 2026-10-20); the design system pass comes last.

1. **Gateway + engine spike**: server connects to one board and plays a 301 leg end to end on a bare `/station/1` page.
2. Corrections + crash recovery (event log).
3. Players + single match created from `/admin`, assigned to a station.
4. Tournament formats + scheduler for two stations.
5. `/display` projector view, long-term stats and seeding.
6. Design system styling across all pages.
