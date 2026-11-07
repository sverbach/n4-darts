# Charts: the average per day, with a tooltip

Status: done
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

## Comments

2026-11-07: Done.
- **Server:** `PlayerProfile.evenings` → `days`. The 6-hour shift stays (`DAY_SHIFT_MS`, "a session past midnight counts to the day it started").
- **`components/charts/`:** `scales.ts` (`valueScale` on d3's `scaleLinear().nice()`, `dayScale` on `scaleUtc`, `nearestIndex`, `thinLabels`), `useWide.ts` (moved out of the stats page), and `LineChart.tsx`: the d3-shape line, square dots, gridlines, thinned date labels, the last value tagged, a dashed crosshair and an HTML tooltip for the nearest day, all from pointer events (a mouse hovers, a touch taps), with the dot under it in accent. Days sit on a **time axis**, so gaps between play days show. `lib/chartScale.ts` is gone.
- **The profile:** "Average per day", tooltip "12 Nov 2026 · 48.3 avg · 3 matches".
- **Card heights (asked for while this was built):** the heatmap and the line chart sit in one row that now stretches both cards to the same height, with each chart centred in its card.
- **Checked** on a scratch server with 30 seeded days spread over six weeks (1440 px: hover; 390 px: tap) and on the local database (5 real days next to the real heatmap). The date labels first overlapped ("20 SEP25 SEP"): the thinning now uses each label's real extent (the first one hangs right, the last one left) and a wider character estimate.
- **Bundle:** `d3-scale` brings d3's time, format and interpolate code: about +38 KB (14 KB gzipped) on top of ticket 01, 465 KB in all.
- **Tests:** `scales.test.ts` (nearest day, label thinning, round ends, a single value, days spaced by time), the server's `days`.
- **Visual suite:** the profile shots changed only in the heading ("Average per day"); retaken. The suite's player has one day, so it shows the single-day block, not the line.
- typecheck, lint, 830 unit tests, build, e2e (41) and the visual suite (9) pass.
