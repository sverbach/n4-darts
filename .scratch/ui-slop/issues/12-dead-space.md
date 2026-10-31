# No dead space on the kiosk, projector, Home and profile

Status: ready-for-agent
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
