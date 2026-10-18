# Bare station page

Status: done
Type: task
Blocked by: 05

`/station/1` in `packages/web` (React + Vite). Functional, unstyled beyond basic readability; mobile friendly.

- Enter two player names, tap who throws first, start the leg.
- Live: both remaining scores, whose turn, current visit darts, "remove darts" when awaiting takeout, winner at the end.
- Tap a dart of the current visit → segment picker → correction.
- "Next player" button and "undo last visit".
- Board offline indicator.
- Two devices on `/station/1` at once stay in sync.

## Acceptance

- Playable on the laptop and on a phone against the simulator.

## Comments

**2026-10-18, done.** `packages/web/src/StationPage.tsx` (new match form with start score, in/out rule and legs; scoreboard; current visit with tap-to-correct segment picker; "Remove darts" prompt; bust; next player, undo, end match; game shot screen), live state via `EventSource` on `/api/stations/:id/live`. API types shared with the server via `@n4/server/api` (type-only). No router library: `/station/:n` is matched by hand. Light and dark follow the OS. Verified in headless Chrome against the built server and the simulator at phone and tablet width: start match, two darts, correct S1 → T20, third dart, takeout, bust, a three-leg match to "Ann wins 2 – 1". Not verified: two physical devices at once (covered by the server test that pushes to every live viewer).
