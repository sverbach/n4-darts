# The profile's average chart readable on a phone

Status: done
Type: task

At 390 px the profile's "Average per evening" chart (`packages/web/src/features/stats/StatsPages.tsx`, AverageChart) clips its y labels ("160" shows as "60") because the left pad is 30 and 3-digit labels sit at x−12; it draws a line every 10 (13 lines for 40–160); the last date label is cut off ("21 OC").

## What to do

- Left pad wide enough for the widest label.
- 4–5 y ticks at a round step.
- The last x label anchored at its end (and the first at its start) so neither is clipped.

## Acceptance

- Visual suite: the profile at phone width with 3-digit averages; all labels whole.

## Comments

2026-11-03: Built. The scale moved to `lib/chartScale.ts` (unit-tested): step from 5/10/20/25/50/100 so there are at most 5 lines; the left pad grows with the widest label; the first date label anchors at its start and the last at its end. Checked on the dev profiles at 390 and 1440. Not in the visual suite: its matches all fall on one evening, so the profile shows the single number, not the chart, and seeding past evenings would move most snapshots.
