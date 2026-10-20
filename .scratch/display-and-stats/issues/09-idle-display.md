# Idle `/display`: leaderboard

Status: done
Type: task
Blocked by: 02, 06

- With no tournament (none created yet, or a finished one replaced by a new draft), `/display` shows the station cards and the leaderboard's top 10 (name, rating, matches, 180s, highest checkout), pushed live as matches finish.

## Acceptance

- Checked in a browser at 1280×720: idle with and without matches on the stations.

## Comments

**2026-10-20, done.** `DisplayView.leaderboard`: the top 10 from the stats service while there's no running or finished tournament on show (a draft counts as none), empty otherwise. The idle `/display` splits like the running one: stations on the left, the leaderboard (rating, matches, 180s, highest checkout) on the right; with nobody ranked yet it shows only the station cards. It's pushed with every change, so a closed match moves the table.
- Test: the leaderboard on the idle display, still there with a draft, gone once the tournament starts.
- Checked in a browser at 1280×720 with the seeded database: idle with and without a match on a station; closing a match updated the player's row live.
