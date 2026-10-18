# Players and matches: run real matches from /admin

Status: ready-for-agent

## Goal

The organiser can run a real evening of single matches without a tournament. Players are a persistent list, stations are configured in `/admin`, and the organiser creates a match (two players, X01 settings, best of N) and puts it on a free station. Players walk up, choose who throws first, and play it out. The result is stored against the players so stats and seeding can use it later.

This is build step 3 from `docs/architecture.md`. Tournaments, the scheduler, walkovers and seeding come in the next spec.

Read first: `docs/architecture.md`, `docs/adr/`, `GLOSSARY.md`, `.scratch/walking-skeleton/` (what already exists).

## Already there (from the walking skeleton)

- The X01 engine already handles best of N (`legsToWin`), alternating the starter every leg, in/out rules, corrections and `VisitUndone`.
- Per-match event log in SQLite. Matches store player *names*, not player ids.
- `/station/n`: start a match by typing two names, live scoreboard, correct darts in the current visit, "next player", undo, close the match.
- Stations come from the `STATIONS` env var.

## In scope

- **Players**: a persistent list in SQLite, managed in `/admin`. Matches reference players by id. Names are unique (case-insensitive); renaming shows the new name everywhere. A player with matches can only be archived (hidden from pickers, history kept); one without matches can be deleted.
- **Fresh schema**: the skeleton's test matches are wiped, no data migration.
- **Stations in `/admin`**: name and Board Manager address, live connection indicator. Adding, editing or removing a station takes effect without a server restart. Replaces the `STATIONS` env var: if the stations table is empty on startup, it is seeded once from `STATIONS`; after that `/admin` is the source of truth.
- **Creating a match** in `/admin`: players plus settings (start score, in/out rule, legs), assigned straight to a free station; a busy station is refused. No queue: queueing and dispatch are the scheduler's job in the tournament spec.
- **Quick match at the station**: the station keeps a start button, but players are picked from the player list (a new player can be added inline) instead of typed as free names.
- **Matches with 2–8 players** (engine and everything above it). Tournament matches stay one against one (next spec); multi-player matches are for `/admin` matches and quick matches. Each match has a fixed player order; the leg starter moves one place along it every leg (with two players: alternating). A leg ends at the first checkout, nobody plays on for places. The setting is "first to N legs" (`legsToWin`); `/admin` may show "best of" wording for two-player matches. No teams or doubles.
- **Station flow**: the station shows the assigned match ("Next: A vs B" or the player list), the players reorder or shuffle the throwing order, and they play. At the end the station shows the result and is free for the next match.
- **Abandoning a match** from `/admin` (or the station): it closes with an `abandoned` flag and no winner, stays in history with the legs played so far, and never counts for results or stats.
- **Board reset mid-visit** (pressed on the laptop): the logged darts stand and the visit carries on with the next darts; no prompt. Resets sent by the server behave as today.
- **`/admin` behind the PIN**: `ADMIN_PIN` env var, asked once per device, remembered in a cookie for 30 days. No PIN configured → `/admin` open with a logged warning. Station actions stay open (ADR-0004): quick match, adding a player inline, abandoning the station's match.
- **Organiser corrections**: in `/admin`, correct any dart in any visit of a running or finished match; a finished match's result follows the correction. No undo of older visits.
- **Match history in `/admin`**: finished matches with the result, and the full visit log per match.
- **Rules version per match**, so later rule changes can't change old results (ADR-0002 consequence).

## Out of scope

Teams/doubles, playing on for places within a leg, tournaments, groups, knockout, scheduler or queue, walkovers, seeding and rating, long-term stats pages, `/display`, `/watch`, design system styling, bull-off.

## Done when

- The organiser adds players and both stations in `/admin` on a phone, creates a best-of-3 501 double-out match and assigns it to station 2; it appears on `/station/2` and can be played to the end on the real board.
- The finished match shows up in `/admin` history with the winner, the legs score and the visit log, linked to both players.
- Without the PIN, `/admin` and its API refuse changes.
- Pressing reset on the laptop mid-visit, then throwing the remaining darts, finishes the visit normally.
- A 4-player quick match can be played at a station, with the leg starter rotating.
- All of the above is covered by automated tests against the simulator.

## Open questions

None open. Answers were folded into the sections above.

1. ~~Where matches come from~~: `/admin`, plus a quick match at the station picked from the player list. (Round 1)
2. ~~Assignment~~: straight to a free station, no queue. (Round 1)
9. ~~Matches with more than two players~~: 2–8 players, outside tournaments only; fixed order, leg starter rotates, first checkout wins the leg, "first to N legs", no teams. (Round 2)
3. ~~Player identity~~: unique case-insensitive names, rename allowed, archive if they have matches, else delete. (Round 3)
4. ~~Migration~~: stations seeded once from `STATIONS`; skeleton matches wiped. (Round 3)
5. ~~Darts lost~~: always keep and continue, no prompt. (Round 4)
6. ~~Organiser corrections~~: any dart, running or finished matches, result follows. (Round 4)
7. ~~PIN~~: `ADMIN_PIN`, 30-day cookie, open with warning if unset. (Round 4)
8. ~~Abandoned matches~~: flagged, no winner, visible in history, never count. (Round 3)

## Tickets

`issues/01`–`10` (10, the simulator UI, is independent of the rest).
