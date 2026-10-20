# Awards for a finished tournament

Status: ready-for-agent
Type: task
Blocked by: 02, 06

- For a finished tournament (not ended early): best match average, highest checkout, most 180s, best leg (fewest darts), each with the player (ties: all tied players). Only this tournament's matches, no walkovers. Uses the per-match numbers from ticket 06.
- Part of the display view and the admin tournament view; shown with the placings on `/display` and in the admin Tournament tab.
- A category nobody scored in (e.g. no 180s) is left out.

## Acceptance

- Tests for the awards, incl. ties and an empty category.
- Checked in a browser: `/display` and the admin tab after a simulated tournament.
