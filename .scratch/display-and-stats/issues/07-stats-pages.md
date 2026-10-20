# Leaderboard and profile pages

Status: done
Type: task
Blocked by: 06

- `/players`: the leaderboard (rating, average, matches, wins, 180s, highest checkout); a row opens the profile. Linked from the home page.
- `/players/<id>`: the numbers from ticket 06 in groups (averages, checkouts, scoring, results), a line chart of the average per day played (plain SVG, axes with dates and values, works with one point), tournaments list, last 20 matches. Not clickable.
- Mobile first (players look themselves up on their phones); public, no PIN.

## Acceptance

- Checked in a browser at phone width with a database holding several evenings (seed it from the simulator or a script).

## Comments

**2026-10-20, done.** `StatsPages.tsx`: `/players` (leaderboard; a name opens the profile; linked from the home page as "Players and stats") and `/players/<id>` (numbers in four groups: average, checkouts, scoring, results; a plain-SVG line chart of the average per evening with a value scale in steps of 10 and dates below, one point works too; finished tournaments with placing; the last 20 matches with result, legs, date and the player's average). The `Leaderboard` table is exported for the idle `/display` (ticket 09). Unknown player: "No such player".
- Checked in a browser at 390 px with a database seeded with 36 bot matches (501 double out, best of 3) over six evenings and a finished tournament: no horizontal scroll, chart text at its real size on a phone.
