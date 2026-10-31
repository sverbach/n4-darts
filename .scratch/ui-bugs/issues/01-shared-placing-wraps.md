# A shared placing ("3–4") wraps on the projector

Status: done
Type: bug

On `/display`'s final placings (`features/display/DisplayPage.tsx`, the `Final placings` list), a shared place such as "3–4" doesn't fit its column (`w-pu-90` at `text-pu-56`): it wraps, and the "4" overlaps the next row. Found while taking the visual baseline (`.scratch/tailwind/issues/01-visual-baseline.md`), and kept as is through the Tailwind migration.

## What to do

- Keep the place on one line (`whitespace-nowrap`) and give the column room for the widest place a tournament can have (e.g. "13–16"), so names still line up under each other.
- Check the champion's row and a single place ("1", "2") still look as in the mockup.

## Acceptance

- At 1920×1080 and 1280×720, a shared place sits on one line and nothing overlaps.
- The visual suite passes; only `display-finished-1080p` and `display-finished-720p` (and any other size that shows the bug) are retaken, and the comments say which screenshots changed and why.
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Docs:** `docs/ui-pages.md` if it describes the placings column.

## Comments

2026-10-31: Confirmed by the user.

2026-10-31: Fixed. The place column is 160 projector units (was 90) and never wraps: "3–4" measures 100 units at `text-pu-56`, "13–16" 153. Retaken: `display-finished` at all four sizes (1080p, 720p, kiosk, phone: the same page at each size).
