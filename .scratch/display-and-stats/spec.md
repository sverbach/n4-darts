# Display and stats

Status: ready-for-agent

## Goal

The room can follow the evening on the projector: the group tables or the bracket, what's on every station with live scores, and what's up next. One station's scoreboard can go on the projector on its own. Players build up long-term stats from every match they play: a public profile, a leaderboard, and awards at the end of each tournament. The database gets a nightly backup.

This is build step 5 from `docs/architecture.md`. The design system pass is still shelved to the very end; the projector pages get plain, large, readable styling.

Read first: `docs/architecture.md` (especially "Decisions so far"), `docs/adr/`, `GLOSSARY.md`, `.scratch/tournaments/` (what exists now).

## Already there

- Stations stream their full view as Server-Sent Events (`GET /api/stations/:id/live`); the station page uses it.
- `GET /api/admin/tournament` returns the whole running tournament (`progress`: phase, stations, queue, group tables, bracket, placings); the admin Tournament tab and the match detail in History poll every 3 s.
- Every dart is in the event log; `dartStats` / `threeDartAverage` (engine) and the rating (last 10 completed matches, no abandoned matches or walkovers) exist.

## In scope

- **Live updates everywhere**: the projector pages and the admin pages (Tournament tab, match detail in History) get pushed updates from the server as Server-Sent Events, like the station page. No polling left.
- **`/display`** (public, no PIN), a fixed split for a 16:9 projector, scaled to fit without scrolling, no rotating pages:
  - Left (about a third): **Now playing**, one card per station: label, names, legs won, each player's remaining score, who's throwing and the darts of the current visit. Below it **Up next**: the next 3–5 queued matches.
  - Right: the current phase. Group tables during the group phase, the bracket in the knockout.
  - After the final: the champion large, the final placings and the evening's awards, until the next tournament is created.
  - No tournament: the station cards (quick and single matches) and the leaderboard's top 10.
  - Tapping a station card opens `/watch/n`. The display never switches to a station by itself.
- **`/watch/n`** (public): the station's scoreboard without any controls (no lineup, start, corrections, Done), enlarged for the projector. A free station shows its name and "Free", or during a tournament the match waiting there ("Next: A vs B"). The home page lists a watch link per station.
- **Backups**: on server start if the newest backup is older than 24 h, then every 24 h, `VACUUM INTO` a dated copy in `DATA_DIR/backups/`; keep the newest 30. No download button. The README explains restoring (stop the server, put the file in place, start it).
- **Stats**, counted over every completed match of any kind (quick, single, tournament, 2–8 players); abandoned matches and walkovers don't count. No filter by game. Calculated from the event log on request; a closed match's numbers are cached and recalculated when it's corrected.
  - **Profile** `/players/<id>` (public): 3-dart average (overall, and the rating = last 10 matches), first-9 average (the first three visits of each leg), checkout % (darts thrown at a one-dart finish that hit it, double-out matches only), highest checkout, 180s, 140+ and 100+ visits, best leg (fewest darts), matches and legs played and won, tournaments played and won, best placing. A line chart of the average per evening (one point per day played; plain SVG, no chart library). Lists: tournaments (date, name, placing) and the last 20 matches (date, opponents, result, the player's average); not clickable.
  - **Leaderboard** `/players` (public, linked from the home page): players with at least one counted match, archived hidden, sorted by rating; columns average, matches, wins, 180s, highest checkout; a row opens the profile.
  - **Awards** for a finished tournament (`/display` and the admin Tournament tab, with the placings): best match average, highest checkout, most 180s, best leg, each with the player. Only this tournament's matches, no walkovers.

## Out of scope

Head-to-head between two players, a backup download or restore button, live stats on `/display` during a tournament, filtering stats by game, design system styling.

## Done when

- During a real tournament evening the projector shows `/display` with live scores, up next and the tables, then the bracket, then the champion, placings and awards, without anyone touching it.
- `/watch/1` mirrors station 1 live.
- The admin Tournament tab updates live without polling.
- After a few evenings a player's profile shows their numbers and a chart, and the leaderboard ranks everyone by rating.
- `DATA_DIR/backups/` holds a daily copy, at most 30.
