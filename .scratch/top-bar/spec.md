# One top bar

Status: done

Every page wrote its own header. They share little, a row with the logo and the theme star, but they had drifted apart: the logo on the right on the stats pages and on the left everywhere else, five logo widths (72 px, 86 px, 3em, 4.8em, 7.2em), and the theme star at two different sizes on /watch and /display.

## Decisions (2026-11-08)

- **`TopBar`** (`components/TopBar.tsx`): the logo always first on the left and the theme star always last on the right. The page passes what goes between them in two slots, `start` (after the logo) and `end` (before the star).
- **Two sizes.** `page` (station, stats) in px. `projector` (/watch, /display) is sized from the viewport on the 1280 scale (`min(100vw, 177.78vh) / 1280`), because /watch counts its `pu` units in 1280ths and /display in 1920ths. So the logo and star are the same size on both projector pages.
- **Contained or full width:** the stats pages centre the bar at 1200 px like their content; the station and the projector pages use the full width.
- **Stats:** the logo moves to the left, then the back link; the theme star moves to the far right.
- **Station:** the logo stays hidden on a phone, where the name, sound, star and board menu need the room.
- **The idle /display** gets the same bar as the running one, so its logo shrinks from the 7.2em hero to the standard size.
- **Not in it:** admin (its tab row wraps under the logo on a phone, so it would need a third slot and a grid mode), and home and the PIN and password pages (a centred logo, not a top bar).

## Tickets

1. `01-top-bar.md`
