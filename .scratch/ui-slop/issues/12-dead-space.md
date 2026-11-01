# No dead space on the kiosk, projector, Home and profile

Status: done
Type: task
Blocked by: 01, 05

- Station player cards on the kiosk: about 200 px of empty band between name and score mid-visit (`station-visit-kiosk`, `watch-visit-1080p`).
- New match on the kiosk: about 280 px of empty settings panel above Continue (`mt-auto`).
- Display knockout: the left column shrinks from 878 to 616 mockup px between phases (`DisplayPage.tsx:88`); the bracket fills half the canvas, the bottom 40% is empty.
- Display finished: placings and awards end at about y=590 beside a full-height champion panel; award names wrap ("BOB" alone).
- Profile: the Results column has 4 tiles against 3 elsewhere (orphan "BEST PLACING", whose label sits off the baseline without a sub-label); the chart and last-matches list don't line up with the tile grid; single orphan tiles on the phone (First 9, Best leg, 100+).
- Home: the footer floats far below the content on the kiosk.

## What to do

- Use the space for what's read there (score larger / checkout row closer on the cards; the bracket scaled to fill; placings and awards spread to the panel's height), or close it up. Don't add content to fill it.
- Profile: tiles in a grid that ends evenly at both widths; chart and list on the grid's columns.

## Acceptance

- None of the listed voids in the new screenshots, at all widths and both projector sizes.
- See `../spec.md` "For every ticket".

## Comments

2026-10-31: Confirmed by the user.

2026-11-01: Built. Station and /watch player cards: the remaining score grows into the card instead of leaving a band under the name (kiosk `clamp(96px, min(15vw, 32vh), 280px)`, projector 240 mockup px; DESIGN.md's display token updated). New match on the kiosk: the settings panel is as tall as its content and Continue sits right under the selects (still at the bottom on a phone). /display knockout: the same columns as the group phase (no shrink between phases), and `Fit` can now grow (`grow`, measured at the content's own width): a small bracket scales up to its half of the screen. /display finished: top-aligned, the champion's panel as tall as its content, so there's no full-height panel beside short lists (the space left below depends on the field's size; with four players it's below everything, not beside it). Profile: the tiles were done in 08 (three per group); the chart and heatmap sit on the tiles' four columns (3 + 1) and the two lists on two columns each, so their edges line up with the tiles. Home's footer went in 08.
