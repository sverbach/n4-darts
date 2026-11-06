# Party modes: foundation and Around the Clock

Status: done
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

## Comments

2026-11-06: Done.
- **Engine.** Shared pieces moved to `events.ts` (segments, events, visits, `started`). X01's fold is now `x01State` / `X01State`. `matchState(settings, events)` dispatches on `settings.mode` and returns that mode's state (`MatchState` is the union). `party.ts` runs the turn order every party mode shares (`playParty`). `closedVisits`, `allVisits` and `upNext` work for every mode. `storedSettings` reads settings without a mode as X01. `isX01Match` narrows a match view or record, and `x01Only` asserts an X01 state.
- **Persisted, never counted.** `completedMatchesOf`, `closedMatches` and `tournamentMatches` return `X01MatchRecord`, filtered in SQL (`coalesce(json_extract(settings, '$.mode'), 'x01') = 'x01'`). So stats, ratings, the profile (heatmap included), the admin history and the leg-duration estimate can't see a party match, and the type system enforces that. `/api/matches/:id` answers 404 for a party match. The tournament config only takes X01 options, so `x01.mode` is refused.
- **Settings input.** `MatchSettingsInput` is a union over modes, and input without a mode is X01, so old clients still work. Party modes refuse X01 options.
- **There's no new-match form in /admin**, only `POST /api/admin/matches`. That route takes the mode, and the picker ("Game") is in the station's quick match. The X01 options are kept while another mode is picked.
- **Screens.** Player cards show each player's target ("Bull" for 25). The visit panel says "Hits" instead of "Total" on the station, /watch and /display. The target board (`components/Dartboard.tsx`, taken out of the heatmap) lights up the current player's target. On the station it sits beside the visit panel on kiosks and under it on phones, and on /watch it sits beside the cards. MatchOver shows the winner and confetti, without the X01 stats. The live admin view lists a party match's visits as one list and takes corrections.
- **Calls and lights.** Only the match shot is called in a party mode. Lights: match start and game shot. Bust, 180 and high out are X01-only for now (High Score will add 180).
- **Noticed:** the scheduler's "last closed" (who rests first) counts party matches too. A player who just finished a party game waits a little longer for their tournament match. I left this as it is, and it shows in the visual suite's tournament queue order.
- **Tests:** Around the Clock in the engine (`aroundTheClock.test.ts`), the server end to end (`matches/partyModes.test.ts`: setup from the station and /admin, refusals, a finished game in no list or stat, a live correction), party calls, party light events, and a refused tournament config.
- **Visual suite:** a new "Around the Clock on station 1" test covers the station (phone, kiosk), /watch and /display while playing and at the win. The new-match baselines changed (Game picker). The tournament-groups baselines changed only in queue order (see above).
- typecheck, lint, 744 unit tests, build, e2e (41) and the visual suite (5) pass.

2026-11-06: Board-first layout (the user's call). In modes with a target board, the board is now the main element. On the kiosk it sits left, sized to the screen (`min(100%, 100dvh - 440px)`), with the players as a compact list (`PlayerList`) on the right, above the buttons. On a phone the board is on top, then the list. On /watch the board is big on the left and the list on the right. X01 and High Score keep their player cards.
