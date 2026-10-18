# Tournament model and group phase (pure)

Status: ready-for-agent
Type: task
Blocked by: 01

Data model and pure group logic; no scheduler, no UI.

- SQLite: `tournaments` (name, status: draft / running / finished, format, legs per phase, X01 settings, created/started/finished at), `tournament_players` (seed, group, withdrawn), and a link from `matches` to a tournament plus its slot (group + fixture, or bracket position). Only one running tournament at a time.
- Pure module (e.g. `packages/server/src/tournament/groups.ts`, or `packages/engine` if it stays I/O-free): snake-seeded groups from a seed order (≥ 3 per group); round-robin fixtures per group (circle method, so everyone plays about as often); group table from results with the tie-breaks: points (win 2), leg difference, head-to-head mini table (points, then leg difference, reapplied to whoever is still level), group 3-dart average, then the higher seed.
- Walkovers count as 2 points and N–0 legs (N = legs to win in the group phase), and not for the average.

## Acceptance

- Unit tests: groups for 3–16 players and 1–4 groups; fixture lists (everyone plays everyone once); every tie-break step, including a three-way tie split by the mini table and one that falls through to the seed.
