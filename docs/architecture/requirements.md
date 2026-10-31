# Requirements

What n4-darts has to do (functional requirements) and how well (quality requirements), plus the constraints it works within. Gathered from the specs in `.scratch/`, `docs/architecture.md`, the ADRs in `docs/adr/` and later decisions. Terms follow `GLOSSARY.md`; stakeholders follow `stakeholders.md`.

Status: **draft** (2026-10-26), for review. It describes the system as built and agreed so far.

**Reading the tables**
- **ID**: a short area prefix and a number, so requirements can be referred to.
- **For**: the stakeholders it mainly serves. Org = organiser, Pla = players, Spe = spectators, Ops = operator, Dev = developer.
- **Source**: where it was decided. "spec: x" is `.scratch/x/spec.md`, "ticket: x" is `.scratch/x/issues/`, "arch" is `docs/architecture.md`.

## Functional requirements

### Playing a match (PLAY)

| ID | Requirement | For | Source |
|---|---|---|---|
| PLAY-01 | Matches are X01: every player counts down from the start score (301, 501, 701 or another) to exactly zero. | Pla | arch |
| PLAY-02 | The in rule (straight, double, master, bull) and the out rule (straight, double, master) are set per match. Default: single in, single out. | Pla, Org | arch |
| PLAY-03 | A match has 2–8 players in a fixed throwing order and is played as "first to N legs". The leg starter moves one place along the order each leg. A leg ends at the first checkout. | Pla | spec: players-and-matches |
| PLAY-04 | Before the start, the players at the station settle the throwing order: reorder or shuffle. | Pla | arch |
| PLAY-05 | Each dart the board detects counts for the player whose visit it is, and the score updates at once. | Pla | arch |
| PLAY-06 | A visit ends when the darts are taken out, not at the third dart, a bust or a checkout. After those, the match waits for takeout, and further darts are ignored and shown as such. | Pla | ADR 0003 |
| PLAY-07 | A bust (below zero, or a score that can't be finished under the out rule) scores nothing for the visit. | Pla | arch |
| PLAY-08 | A player who isn't "in" yet under the in rule scores nothing until a dart gets them in, and the station shows it. | Pla | arch |
| PLAY-09 | At the station, players correct any dart of the current visit by picking the right segment. The original detection is kept. | Pla | arch, ADR 0002 |
| PLAY-10 | At the station, players add a dart the board missed as the visit's next dart. It counts like any other dart. | Pla | ticket: missed-darts |
| PLAY-11 | At the station, players undo the current visit, or the last one if the current one is empty. | Pla | arch |
| PLAY-12 | "Next player" ends a visit when the takeout isn't detected, and resets the board. | Pla | arch |
| PLAY-13 | A board reset pressed at the board keeps the logged darts. Mid-visit the visit carries on; if the visit is already waiting for takeout, the reset ends it. | Pla | spec: players-and-matches |
| PLAY-14 | Darts thrown when nobody is playing (an idle station, or the wrong player) are ignored. | Pla | arch |
| PLAY-15 | On the kiosk layout, while the current visit can still finish the leg, the station shows the best checkout route for the darts left, following the out rule. | Pla | ticket: checkout-hints |
| PLAY-16 | When the match is won, the station shows "Game shot", the winner and the legs. Players close it with "Done", which frees the station. A win can still be undone until then. | Pla | spec: players-and-matches |
| PLAY-17 | Each match records the version of the rules it was played under, so rule changes never change old results. | Pla, Org | ADR 0002 |

### Boards (BOARD)

| ID | Requirement | For | Source |
|---|---|---|---|
| BOARD-01 | Each station is connected to one automatic dartboard, and n4-darts receives every dart it detects. | Pla | ADR 0001 |
| BOARD-02 | A lost connection to a board is re-established by itself. No dart is lost or counted twice across a reconnect or a server restart. | Pla | arch |
| BOARD-03 | Every station shows the board's state: online, stopped (detection not running) or offline. | Pla, Org | spec: board-menu-and-photos |
| BOARD-04 | From the station and from the organiser's station list, anyone can stop or start detection, auto-calibrate the board, and reset it. Stopping and calibrating ask for confirmation. | Pla, Org | spec: board-menu-and-photos |
| BOARD-05 | n4-darts resets the board when a match starts, and after "Next player" and undo, so the board's darts and the match agree. | Pla | arch |

### Players (PLAYER)

| ID | Requirement | For | Source |
|---|---|---|---|
| PLAYER-01 | Players are a list that persists across evenings, managed by the organiser. | Org, Pla | arch |
| PLAYER-02 | Names are unique, ignoring case. Renaming shows the new name everywhere, in old matches too. | Org | spec: players-and-matches |
| PLAYER-03 | A player with matches can only be archived: hidden from the pickers, history kept. A player without matches can be deleted. | Org | spec: players-and-matches |
| PLAYER-04 | A new player can be added on the spot at the station, without the organiser. | Pla | spec: players-and-matches |
| PLAYER-05 | The organiser can give a player a photo (camera or gallery, cropped square), replace it or remove it. Without a photo, a player shows initials on a colour of their own. | Org, Pla | spec: board-menu-and-photos |
| PLAYER-06 | A player's photo or initials appear wherever the player does: station, projector, profile, lists and pickers. | Pla, Spe | spec: board-menu-and-photos |
| PLAYER-07 | Guests either get their own player or play as a shared "Guest" player (a convention, not a feature). | Pla, Org | stakeholders |

### Matches outside tournaments (MATCH)

| ID | Requirement | For | Source |
|---|---|---|---|
| MATCH-01 | Players start a quick match at a free station: pick players from the list, choose the settings, settle the order, play. | Pla | spec: players-and-matches |
| MATCH-02 | The organiser creates a match (players and settings) and puts it straight on a free station. A busy station is refused. | Org | spec: players-and-matches |
| MATCH-03 | A match can be ended without a result (at the station or by the organiser). It stays in the history with the legs played so far and never counts for anything. A match that hasn't started is simply removed. | Org, Pla | spec: players-and-matches |
| MATCH-04 | The organiser sees what's on every station and the history of finished matches, with the result and every visit of every leg. | Org | spec: players-and-matches |
| MATCH-05 | The organiser can correct any dart of any running or finished match. The result follows the correction. Corrected and added darts stay recognisable. | Org | spec: players-and-matches |

### Tournaments (TOUR)

| ID | Requirement | For | Source |
|---|---|---|---|
| TOUR-01 | There is at most one active tournament at a time: one evening. Finished tournaments stay in the history. | Org | spec: tournaments |
| TOUR-02 | The organiser creates a tournament on one page: name (default: today's date), players, format, legs per phase, start score, in and out rules. It is saved as a draft, and nothing starts until "Start tournament". | Org | spec: tournaments |
| TOUR-03 | Format: a group phase (one or more groups, everyone plays everyone once), then a single or double elimination knockout. Double elimination has a grand final with an optional bracket reset. Defaults: one group, double elimination, bracket reset on. | Org | arch |
| TOUR-04 | Groups, winners bracket, losers bracket and final each have their own number of legs. Group default: best of 1. | Org | arch |
| TOUR-05 | With one group everyone advances; with more, the top N of each group (configurable). | Org | arch |
| TOUR-06 | While drafting, the organiser sees the seeds (and can reorder them), the resulting groups, any problems that block the start, and the expected duration. | Org | spec: tournaments |
| TOUR-07 | Seeds come from each player's rating (RATING-01). Players without a rating go below, in a random order that can be changed. More groups are filled snake-wise by seed. | Org, Pla | spec: tournaments |
| TOUR-08 | Until the first match is played, players and format can change freely and the fixtures are regenerated. After that only withdrawals and late arrivals. | Org | spec: tournaments |
| TOUR-09 | Group tables: a win is 2 points. Ties are broken by leg difference, then a mini table of the tied players' mutual matches, then their average in this tournament's groups, then the higher seed. | Pla, Org | spec: tournaments |
| TOUR-10 | When the groups are done, the knockout is drawn by itself: the next power of two, byes for the top seeds, group winners then runners-up, crossed so players from the same group avoid each other early. In double elimination, losers drop into the losers bracket, placed to avoid rematches. No third-place match. | Org, Pla | spec: tournaments |
| TOUR-11 | Winners move on until there is a champion. At the end there are final placings (1, 2, 3, 4, then shared places by the round a player went out). | Org, Pla | spec: tournaments |
| TOUR-12 | A player who withdraws loses every remaining match by walkover (groups: 2 points, all legs). A match running at that moment is ended. Played results stand. | Org | spec: tournaments |
| TOUR-13 | A late player can join during the group phase only. They go into the smallest group and their matches are queued. | Org | spec: tournaments |
| TOUR-14 | A correction to a finished tournament match must leave a winner. What depends on the result (tables, knockout, next matches) is rebuilt while it hasn't started. Otherwise the correction is refused, naming the match in the way. | Org | spec: tournaments |
| TOUR-15 | The organiser can end a tournament early. Matches not yet played are dropped. | Org | spec: tournaments |
| TOUR-16 | When creating, the tournament shows its expected duration ("about 2 h 30"); during the evening, the expected end time, updated as matches finish. It is based on the real leg lengths of the last 50 matches at the same start score, with defaults until there are at least 5 legs. | Org | spec: tournaments, ticket: perf-tests |
| TOUR-17 | Tournament matches are labelled at the station (e.g. "Group A · match 4", "Winners semi-final"). | Pla | spec: tournaments |

### Scheduling the evening (SCHED)

| ID | Requirement | For | Source |
|---|---|---|---|
| SCHED-01 | A free station gets the next tournament match whose players are both free, the longest-rested first, without the organiser doing anything. | Org, Pla | arch |
| SCHED-02 | The knockout starts when the group phase is complete. | Org | arch |
| SCHED-03 | A finished tournament match frees its station on "Done", or by itself 60 s after the checkout. A player's rest starts when their match closes. | Org, Pla | spec: tournaments |
| SCHED-04 | Quick and single matches can use a free station during a tournament. That station and those players count as busy. | Pla, Org | spec: tournaments |
| SCHED-05 | The organiser can pause a station (the current match carries on, no new ones), pin a match to a station, hold a match, send a match that hasn't started back to the queue, and play a chosen match now on a chosen free station. | Org | spec: tournaments |
| SCHED-06 | A match sent back from a station isn't given straight back to the same station. | Org | spec: tournaments |
| SCHED-07 | A free station during a tournament says why it's free: no match ready (waiting for players), or paused. | Pla | spec: tournaments |
| SCHED-08 | The organiser sees the queue, each station's state, the group tables, the bracket and the players, all live. | Org | spec: tournaments |

### Following the evening (VIEW)

| ID | Requirement | For | Source |
|---|---|---|---|
| VIEW-01 | Every screen except the stats pages updates by itself, with no refresh. | Spe, Pla, Org | spec: display-and-stats |
| VIEW-02 | A projector view shows the whole evening at once, with nothing to press: what's on every station (players, legs, remaining scores, who's throwing, the current visit), what's up next, and the group tables or the bracket. | Spe | spec: display-and-stats |
| VIEW-03 | After the final, the projector shows the champion, the final placings and the evening's awards until the next tournament is created. | Spe, Pla | spec: display-and-stats |
| VIEW-04 | Without a tournament, the projector shows the stations and the top 10 of the leaderboard. | Spe | spec: display-and-stats |
| VIEW-05 | Any one station's scoreboard can be shown on its own (e.g. on the projector), without controls. From the projector view, a tap on a station opens it. The projector view never switches by itself. | Spe | spec: display-and-stats |
| VIEW-06 | Any number of devices can show or control a station at the same time. | Pla, Spe | ADR 0004 |

### Ratings (RATING)

| ID | Requirement | For | Source |
|---|---|---|---|
| RATING-01 | A player's rating is their 3-dart average over their last 10 completed matches (counted as in STATS-01). A player without a completed match has no rating. It seeds tournaments and ranks the leaderboard. | Org, Pla | spec: tournaments |

### Stats (STATS)

| ID | Requirement | For | Source |
|---|---|---|---|
| STATS-01 | Stats count every completed match of any kind and size. Abandoned matches and walkovers never count. | Pla | spec: display-and-stats |
| STATS-02 | A public profile per player: rating and rank, 3-dart average, first-9 average, checkout %, highest checkout, 180s, 140+ and 100+ visits, best leg, matches and legs played and won, tournaments played and won, best placing. | Pla | spec: display-and-stats |
| STATS-03 | The profile shows the average per evening as a chart, the tournaments played with placings, and the last 20 matches. An evening that runs past midnight counts to the day it started. | Pla | spec: display-and-stats |
| STATS-04 | The profile shows where the player's last 500 board-detected darts landed, as a heatmap on a drawn board. Bounce-outs, added darts and corrected darts are left out. | Pla | ticket: player-heatmap |
| STATS-05 | A public leaderboard of everyone with a counted match, archived players hidden, ranked by rating. | Pla, Spe | spec: display-and-stats |
| STATS-06 | Each finished tournament gets awards: best match average, highest checkout, most 180s, best leg. Ties are shared and empty categories left out. | Pla, Spe | spec: display-and-stats |
| STATS-07 | A correction to a past match updates every stat that depends on it. | Pla | spec: display-and-stats |

### Administration (ADMIN)

| ID | Requirement | For | Source |
|---|---|---|---|
| ADMIN-01 | The organiser's area is protected by a shared PIN, asked once per device and remembered for 30 days. Without a configured PIN it's open, with a warning. | Org | ADR 0004 |
| ADMIN-02 | Players never log in. Everything players need at the station works without the PIN: quick match, adding a player, corrections, ending the station's match, the board menu. | Pla | ADR 0004 |
| ADMIN-03 | The organiser manages the stations (name and board address), with a live connection indicator per station. Changes take effect without a restart. | Org, Ops | spec: players-and-matches |
| ADMIN-04 | On first start the stations are created from the server configuration once. After that the organiser's list is what counts. | Ops | spec: players-and-matches |

### Operation (OPS)

| ID | Requirement | For | Source |
|---|---|---|---|
| OPS-01 | The database is backed up by itself: at start if the newest backup is over a day old, then every day. The newest 30 are kept. | Ops | spec: display-and-stats |
| OPS-02 | The operator can restore a backup by putting the file in place while the server is stopped. | Ops | spec: display-and-stats |
| OPS-03 | A diagnostics page (organiser's area) shows whether the server keeps up: event-loop delay, open live connections, how long views take, database writes, board connections, and the time from the board to the screens for the last 20 darts. It also shows whether the page's own request came through a proxy. | Ops | ticket: diagnostics |
| OPS-04 | Live updates keep working behind a reverse proxy without special proxy configuration. | Ops | ticket: live-behind-proxy |
| OPS-05 | An update is: pull a new image and restart. | Ops | arch |

## Quality requirements

| ID | Quality | Requirement | For | Source |
|---|---|---|---|---|
| Q-01 | Availability | A full tournament evening runs with the internet unplugged. Nothing is loaded from outside the room at runtime. | Org, Ops | ADR 0005 |
| Q-02 | Reliability | After a server restart, every match resumes exactly where it was, including the visit in progress. | Pla, Org | spec: walking-skeleton |
| Q-03 | Reliability | No dart is ever lost or counted twice, across board reconnects, server restarts and darts the board missed. | Pla | arch |
| Q-04 | Integrity | Results are always derived from the full record of the match. Nothing is overwritten: corrections are added on top, and old matches are replayed under their own rules. | Pla, Org | ADR 0002 |
| Q-05 | Responsiveness | A detected dart reaches the station's screens within 150 ms, measured over a long match. | Pla | ticket: perf-tests |
| Q-06 | Scalability | Responsiveness doesn't degrade over a long match, over an evening, or as the history grows over months. Tested over 600 darts with 200 past matches, and in the browser over 300 darts. | Pla, Ops | ticket: perf-tests |
| Q-07 | Durability | At most a day of data can be lost to a broken disk, given the operator keeps the backup folder elsewhere too. | Ops | spec: display-and-stats |
| Q-08 | Usability | The station can be used by touch, quickly, from where the player stands, and is readable from 2–3 m. | Pla | docs/ui-pages.md |
| Q-09 | Usability | The projector pages are readable from across the room and fit any screen without scrolling. | Spe | spec: design-system |
| Q-10 | Usability | Every page works on a phone (about 390 px wide) and on a laptop or kiosk (about 1440 px), with a layout for each. The organiser's area is made for a phone first. | Org, Pla | spec: design-system |
| Q-11 | Consistency | One visual language across all pages. Every colour is a named role, so a theme can be added in one place. | Pla, Dev | spec: design-system |
| Q-12 | Security | The PIN stops accidental edits by guests, not attackers. The system is for a private room and must not be exposed to the internet. | Org, Ops | ADR 0004, ticket: live-behind-proxy |
| Q-13 | Privacy | Player data (names, photos, history) stays on the room's server and in its backups. | Pla | ADR 0005 |
| Q-14 | Testability | Everything can be exercised without a real board, through a simulator that speaks the board's protocol. Game rules, scheduling and brackets can be tested without any I/O. | Dev | arch |
| Q-15 | Maintainability | Every change runs the full checks: types, lint, unit and integration tests, a load test, browser tests and the build. Nothing ships that fails them. | Dev, Ops | CI |
| Q-16 | Maintainability | The game rules exist once and are shared by the server and the browser. | Dev | ADR 0006 |
| Q-17 | Observability | A slow or broken evening can be explained afterwards from the diagnostics, and collecting them costs next to nothing when nobody looks. | Ops | ticket: diagnostics |
| Q-18 | Deployability | One container image and one data volume. The station laptops run nothing of ours. | Ops | arch |

## Constraints

- **Detection is Autodarts.** Each station has an Autodarts board with its Board Manager on a Windows laptop. n4-darts uses only its local, unofficial and unauthenticated API (state snapshots plus start, stop, reset, calibrate). An update by the vendor can break it (ADR 0001, `docs/board-manager-api.md`).
- **Nothing of ours on the laptops.** They run the Board Manager and a browser in kiosk mode (arch).
- **One server in the room.** A Linux machine with Docker on the same network as the boards (arch).
- **Two stations today.** Nothing should assume exactly two (arch).
- **If the server is down, nobody can play.** A relay on the laptops that buffers darts was rejected (ADR 0001).

## Deliberately out of scope

- Games other than X01 (Cricket etc.). The rules are versioned and kept apart so they can come later.
- Teams, doubles, playing on for places within a leg, a third-place match.
- Bull-off detection for who starts, and a sound caller.
- More than one tournament at a time.
- Online play, remote players, public access.
- Head-to-head stats and filtering stats by game, evening or tournament.
- Players uploading their own photo, a light theme, a backup download or restore button.
- Replacing Autodarts detection, or supporting other boards.
