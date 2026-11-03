# "Next player" as a secondary button

Status: done
Type: task

The station's "Next player" is the slanted violet CTA through every visit (`packages/web/src/features/station/StationPage.tsx`, the `primary cta` button). DESIGN.md keeps the slant for a screen's one main action and violet for "this one, now"; "Next player" is the fallback when the board misses a takeout.

## What to do

- Style it as the default (secondary) button: Cockpit Surface fill, Frame Line border, Phosphor Paper text, no slant.
- Keep its place, size (kiosk and phone) and the "Up: X" line. Never move it into the ⋮ menu.
- `docs/ui-pages.md` (station buttons): "a primary Next player" becomes secondary, with the reason.

## Acceptance

- Station visit snapshots updated; the button is in the same place and size and still reads "Up: X".

## Comments

2026-11-03: Built. The button keeps the CTA's size (60px phone, 72px kiosk, 16/20px label) and place, without the violet fill and the slant; "Up: X" stays. docs/ui-pages.md updated. Snapshots: station-visit phone and kiosk.
