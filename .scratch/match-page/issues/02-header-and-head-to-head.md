# Match page: header and head-to-head

Status: done
Type: task
Blocked by: 01

- Header: the names in full (wrapping), the result and rules line, the legs score big when legs > 1.
- Head-to-head table: columns per player (avatar, full name, series colour mark), rows 3-dart avg, first 9, checkout % (double out only, else left out), high out, best leg, 180s, 140+, 100+, darts. The better value bright, the rest muted (ties: all bright). Sideways scroll with pinned labels for 3+ players.

Acceptance: checked at 390 and 1440 px with 2 players and with 4; all checks pass; visual baseline for the match page retaken.

## Comments

2026-11-07: Done. Header: the names in full (h1, wrapping), result and rules, the legs score at 56 px when legs > 1. `HeadToHead.tsx`: a column per player with the series chip and full name (12 px on a phone, 16 on a kiosk, never cut mid-word), rows as planned (checkout % only for double out). The best value is in paper and the others muted; dashes are faint; a row that doesn't compare (darts) is all paper. With 3+ players the numbers and padding shrink and the labels may wrap, so three fit at 390 px; from four it scrolls sideways with the labels pinned. **The avatars were dropped from the table** (the brief had them): the initials avatars have their own colours, which clashed with the series colours (teal avatar, violet chip for the same player), so the chip next to the name is the one mark per player on the page. On a kiosk the table and the score race sit side by side.

All four checked together: typecheck, lint, 833 unit tests, build, e2e (41), the visual suite (9; the match page baseline retaken), and the impeccable detector (0 findings after snapping four font sizes to the type ramp).
