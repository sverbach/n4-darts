# The small items from critique run 3

Status: done
Type: task

- "UP: BOB" inside Next player is about 11 px: 16 px on the kiosk at least (what a waiting player looks for).
- An empty "TOTAL" with no value before the first dart (station, /display cards): hide the label until there's a total.
- Admin player rows have two "more" controls (the avatar's "…" badge and ⋮): the photo action moves into the ⋮ menu ("Change photo"); the avatar stays tappable without the badge.
- Red for "Board offline": PRODUCT.md says status shows only "ok" and "warn". Decide one: make offline amber (warn), or update PRODUCT.md to allow danger for "not working". Recommended: keep red for broken (offline) and amend PRODUCT.md, since a board that's gone stops play.
- HOLD vs SEND BACK vs PAUSE: a one-line hint under Stations and Queue in admin.
- Play now on a match "Waiting for players": disabled with the reason in its title.
- Profile phone: "since Nov 2026" doesn't break inside the date.
- Profile chart with a single evening: the number alone, no axes.

## Acceptance

- Each item fixed or noted here with why not.

2026-11-01: Built, item by item:
- "Up: Bob" in Next player: 16px on the kiosk, 12px on a phone.
- No "Total" label before the visit's first dart: station, /display station cards, /watch.
- Admin player rows: one "more" control. "Change photo" moved into the ⋮ menu; the avatar stays tappable (named "Photo of …") without its badge.
- Red for "Board offline": kept. PRODUCT.md and `docs/ui-pages.md` now name three status tones: ok (green), warn (amber: needs a look) and danger (red: broken, a board or the server offline).
- A one-line hint under admin's Stations explains Pause, Send back and Hold.
- Play now is disabled for a match that's waiting for players, and its title says why.
- Profile: "since Nov 2026" doesn't break inside the date (non-breaking space).
- Profile chart with one evening: the value and its date alone, no axes.
