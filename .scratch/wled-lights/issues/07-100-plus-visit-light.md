# A light for a visit of 100+

Status: done
Type: task

Asked for after the real lights check (2026-11-07): "High out (100+)" only fires for a **checkout** of 100 or more, which a group of beginners rarely throws. A visit of 100 or more is rare enough to celebrate on its own.

## Decisions (2026-11-07)

- **A new light event, "100+ visit"** (`s100`), with its own preset and seconds per station, like the others.
- **It fires for any visit totalling 100 or more** that isn't a bust, once per visit, in X01 and High Score (the modes that score points). A visit of exactly 180 counts too.
- **Priority:** after 180, before bust: game shot, high out, leg won, 180, **100+ visit**, bust, match start. So a 180 or a high out shows its own preset when one is set, and the 100+ one otherwise.
- **Not a call:** the caller already says the score.

## What to do

- `LightEvent` and its schema get `s100`; `lights/show.ts` fires it.
- Admin → Lights lists "100+ visit" between 180 and Bust.
- The fake WLED device gets a preset named "100+".
- Docs: glossary "Light event", README features, `docs/ui-pages.md` (lights tab).

## Acceptance

- Light tests: 100 and 140 fire it, 99 doesn't, a bust doesn't, a 180 picks the 180 preset when there is one and the 100+ one when not, and a second 100+ visit in the same leg fires again.
- All checks pass.

## Comments

2026-11-07: Done.
- `s100` in `LightEvent` and its schema. Admin → Lights shows "100+ visit" between 180 and Bust, and the fake WLED device has a ninth preset "100+".
- `visitEvents` (`lights/show.ts`) now returns every event a visit earns (high out, 180, 100+), and the priority list picks the first one with a preset. So a 180 shows the 180 preset if there is one, and the 100+ one otherwise.
- The 100+ event fires once the visit is over: three darts, a checkout, or taken out early. 120 after two darts doesn't light up just before a bust on the third.
- **Also checked (the question that led here):** nothing in the lights is "once per game". Events are remembered per visit (first dart + event), so a second high out in the same match fires again.
- Docs: glossary (Light event), README, `docs/ui-pages.md` (Lights tab), `06-runtime-view.md` (priority).
- Tests: 100 and 140 fire it, 99 and a bust don't, a visit taken out early fires it, a 180 lists the 180 first, a second 100+ in the same leg fires again.
- typecheck, lint, 821 unit tests, build, e2e (41) and the visual suite (9; the Lights page baseline is one row taller) pass.
