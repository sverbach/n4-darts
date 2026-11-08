# A shared top bar for the station, stats, /watch and /display

Status: done
Type: task

See `.scratch/top-bar/spec.md`.

## What to do

- `components/TopBar.tsx` with `size` (`page` | `projector`), `contained`, `hideLogoOnPhone`, `start`, `end` and a `className` for the page's own padding.
- Use it in the station, `StatsFrame`, /watch and both /display headers.
- DESIGN.md and docs/ui-pages.md: the top bar and the stats logo's new place.

## Acceptance

- Each page's content is in its bar as before; the logo is on the left everywhere, the theme star on the right.
- The visual suite passes with retaken screenshots, checked by eye.
- All checks pass.

## Comments

2026-11-08: Done. `TopBar` got one more slot than planned, `menu`, after the theme star: the station's ⋮ board menu and /watch's sound button stay at the far right, where they were. The station's logo shrank from 86 to 72 px, and /display's star grew to /watch's size. 47 screenshots were retaken: every page with one of these bars.
