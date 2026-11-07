# Charts: the average per day, with a tooltip

Status: ready-for-agent
Type: task
Blocked by: 01

See the spec's decisions.

## What to do

- Server: `PlayerProfile.evenings` → `days` (same shape; the 6-hour shift stays).
- `components/charts/`: shared pieces built on `d3-scale` and `d3-shape`: a time and value scale, an axis with thinned labels, a line with dots, a crosshair and a tooltip that work with hover (pointer) and tap.
- The profile's chart: "Average per day", a dot per day, the hover/tap tooltip for the nearest day ("12 Nov 2026 · 48.3 avg · 3 matches"), and the last value labelled. `lib/chartScale.ts` goes if nothing else uses it.

## Acceptance

- Tests: the nearest-day lookup, label thinning, and the server field rename.
- Checked in the browser at 390 px and 1440 px with a few days and with many (30+). The tooltip works with the mouse and by tap.
- All checks pass, and the visual baseline for the profile is checked and retaken.
