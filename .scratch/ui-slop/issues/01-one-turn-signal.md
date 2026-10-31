# One turn signal on the station and watch

Status: done
Type: task

Whose turn it is shows five times: the card's violet border and tint, the "▸ THROWING" tab (`components/PlayerCards.tsx:94-98`), the violet score, "VISIT · ANN" (`features/station/StationPage.tsx:370`), "ANN TO THROW" (`StationPage.tsx:458`), and on watch a violet name too (`features/watch/WatchPage.tsx:111`, `:140`). DESIGN.md says the violet score is *the* signal. The extras crowd the visit total, which players read from 2–3 m after every dart (screenshots `station-visit-*`, `watch-*`).

## What to do

- Keep: the violet remaining score and the violet card border.
- Remove: the THROWING tab; the player's name from the visit header (it reads "VISIT" / "TOTAL"); the violet name on watch (name in Phosphor Paper like the others).
- "<name> to throw": show only between visits (when no dart of the visit is down yet), not under the darts mid-visit. On the phone the "Tap a dart to correct it" hint doesn't stack under it (`StationPage.tsx:462`); one hint line at most.
- Keep "Up: Bob" on Next player: it's new information.
- Check the same on `/display`'s station cards: one signal there too.

## Acceptance

- Mid-visit, the station and watch show the turn only through the violet score and border.
- Between visits, one line says who throws.
- `docs/ui-pages.md` (station, watch) and DESIGN.md's Scoreboard Player Card match.
- See `../spec.md` "For every ticket".

## Comments

2026-10-31: Confirmed by the user.

2026-10-31: Built. The THROWING tab and the violet names are gone (station and watch); the visit header reads "Visit". Under the darts one line: "Remove darts", "<name> to throw" before the first dart, or "Tap a dart to correct it" once one is down (kiosk and phone alike; the kiosk header hint went). `/display` station cards already showed the turn only by frame and score. Visual baseline updated.
