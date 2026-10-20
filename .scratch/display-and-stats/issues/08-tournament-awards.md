# Awards for a finished tournament

Status: done
Type: task
Blocked by: 02, 06

- For a finished tournament (not ended early): best match average, highest checkout, most 180s, best leg (fewest darts), each with the player (ties: all tied players). Only this tournament's matches, no walkovers. Uses the per-match numbers from ticket 06.
- Part of the display view and the admin tournament view; shown with the placings on `/display` and in the admin Tournament tab.
- A category nobody scored in (e.g. no 180s) is left out.

## Acceptance

- Tests for the awards, incl. ties and an empty category.
- Checked in a browser: `/display` and the admin tab after a simulated tournament.

## Comments

**2026-10-20, done.** `stats.awards(tournamentId)` (`stats.ts`): best match average, highest checkout, most 180s (summed over the tournament), best leg (fewest darts), from the cached per-match numbers of the tournament's played matches (no walkovers, no abandoned ones); ties list every tied player, a category without a value (e.g. no 180s) is left out. `TournamentProgress.awards` (null unless finished with placings, so an ended-early tournament has none) and `DisplayView.awards`; `createTournaments` takes the stats service. Web: an `Awards` list (`TournamentRun.tsx`) under the placings in the admin Tournament tab, and beside the placings on `/display`.
- Test: values, a tie, an empty 180s category, a walkover and a match outside the tournament left out.
- Checked in a browser after a simulated 7-player tournament: the admin tab at phone width and `/display` at 1280×720.
