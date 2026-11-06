# Party modes: foundation and Around the Clock

Status: ready-for-agent
Type: task

The groundwork every party mode needs, proven end to end with the simplest mode. See the spec's decisions.

## What to do

- **Settings.** Match settings get a `mode` (`x01` | `aroundTheClock` | `golf` | `highScore` | `killer` | `cricket`) plus that mode's options. Settings stored without a mode read as X01. Each mode has its own rules version.
- **Engine.** One entry point folds the event log by mode, so callers don't branch on the mode themselves. Around the Clock is the first party mode in it. It reuses the existing events (darts, corrections, added darts, takeout, ending a visit, undo), works on single games with no legs, and gives a winner on the spot.
- **Server.**
  - Party modes can't be used in tournaments: the scheduler and tournament routes only make X01 matches, and the request schemas (zod, ADR 0010) refuse anything else there.
  - Every finished-match query and stat skips anything that isn't X01: stats, leaderboard, rating, profile (results, recent matches, heatmap), match history, the admin match list and the public site.
  - Calls: `matchshot` for the winner, and no score calls in Around the Clock.
  - Lights: "match start" and "game shot".
- **Web.**
  - A mode picker in the /admin new-match form and the station quick match, showing only the chosen mode's options (Around the Clock has none).
  - An Around the Clock scoreboard (each player's current target) on the station, /watch and /display.
  - Confetti on the winner.
  - **Target board:** pull the dartboard drawing out of `Heatmap.tsx` into a shared component that can highlight segments. The heatmap uses it as before, and the party scoreboards use it for the current player's target (here: the number or the bull).

## Acceptance

- Engine tests: one-step moves, several moves in one visit, either bull finishing, the win on the spot, corrections and undo replaying, and old settings without a mode reading as X01.
- Server tests: a finished Around the Clock match is in none of the lists or stats above, and a tournament can't be made with a party mode.
- A simulator game at 390 px and 1440 px on the station and /watch: the target board highlights the right target, and the winner gets confetti and the match-shot call.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm e2e` and the visual suite pass.
