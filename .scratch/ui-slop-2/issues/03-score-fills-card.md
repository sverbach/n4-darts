# The remaining score sized to its card

Status: done
Type: task

ui-slop 12 raised the clamp, but there's still about 110 px of void between name and score on `station-visit-kiosk` and about 210 px on `watch-visit-1080p`, and the right half of each card is empty. DESIGN.md says the score grows into the card. It's the most-read number in the product.

## What to do

- Size the score from the card, not the viewport: container query units (`cqh`/`cqw` with `container-type: size` on the card) or the projector's `Fit`-style measurement, capped so three digits fit the card's width.
- Two-player cards, station kiosk and /watch; check the 3–8 player layouts don't break (they keep their own sizes if the fit makes them worse).
- DESIGN.md's display token describes the rule instead of a clamp.

## Acceptance

- On `station-visit-kiosk`, `watch-visit-1080p` and `-720p` the score fills the space under the name (no band larger than one row of meta text).
- "501" fits in the card at every shot size.

## Comments

2026-11-01: Confirmed by the user ("go ahead with the ui-slop-2 tickets").

2026-11-01: Built. With two players on the kiosk and on /watch the score row is a size container (`container-type: size`) and the number is `min(125cqh, 55cqw)`: as tall as its row at line-height 0.8, never wider than three digits fit ("501" fills the card's width at most). On the kiosk it fills the space under the name; on the projector the card is taller than three digits are wide, so the number sits right under the name and the remaining space is at the card's foot instead of between name and score. Phones and the 3–8 player layouts keep their sizes. DESIGN.md's display token describes the rule.
