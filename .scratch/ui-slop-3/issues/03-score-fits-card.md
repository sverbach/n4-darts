# The remaining score stays inside its card

Status: done
Type: task

On /watch the 3-digit remaining score runs past its card: with "244" the glyphs end at x=996 while the card ends at 948 (1920×1080), and at 664 vs 632 (1280×720). The size is `min(125cqh, 55cqw)` (`packages/web/src/components/PlayerCards.tsx`), and three Geist Pixel digits are wider than 55cqw. The station kiosk's two-player cards use the same size.

## What to do

- Size the score so three of the widest digits fit the card (e.g. `min(125cqh, 48cqw)`, or from the measured digit advance), on /watch and on the station kiosk.
- Keep it as large as fits: the score still fills its card.

## Acceptance

- Visual tests with a wide 3-digit score (e.g. 400 or 404) on /watch at 1080p and 720p and on the station kiosk; a check that the score's box stays inside the card.

## Comments

2026-11-03: Built. Measured Geist Pixel: "444" is 2.05em wide (the widest 3 digits), so 55cqw overflowed and 48cqw fits; changed in both PlayerCards variants. Instead of a new visual snapshot, an e2e test (`station.spec.ts`, "a wide 3-digit score stays inside its card") plays 501 down to 444 and checks the score box stays inside the card on the station kiosk and /watch at 1080p and 720p; it failed on /watch at 1920 with the old size. Snapshots: watch-visit 1080p, 720p, kiosk.
