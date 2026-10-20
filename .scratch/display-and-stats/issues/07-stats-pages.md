# Leaderboard and profile pages

Status: ready-for-agent
Type: task
Blocked by: 06

- `/players`: the leaderboard (rating, average, matches, wins, 180s, highest checkout); a row opens the profile. Linked from the home page.
- `/players/<id>`: the numbers from ticket 06 in groups (averages, checkouts, scoring, results), a line chart of the average per day played (plain SVG, axes with dates and values, works with one point), tournaments list, last 20 matches. Not clickable.
- Mobile first (players look themselves up on their phones); public, no PIN.

## Acceptance

- Checked in a browser at phone width with a database holding several evenings (seed it from the simulator or a script).
