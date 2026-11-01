# The second layer: one signal, one owner, room-sized

Status: needs-triage

Follow-up to `.scratch/ui-slop/`. Its 15 tickets fixed the repeats, spacing, type and pills; the re-critique of 2026-11-01 (`packages/web/.impeccable/critique/2026-11-01T09-16-50Z__src.md`, 27/40, 3 P1s) found the next layer. This set takes those on, plus what was left open in ui-slop 16.

Read first: `packages/web/PRODUCT.md`, `packages/web/DESIGN.md`, `docs/ui-pages.md`, `GLOSSARY.md`.

## The rules the tickets apply

- **One signal.** Violet means *this one, now*: the thrower's score, a selection, the primary action, focus, the big moment's brackets. Not names, ranks, columns or labels.
- **One owner per fact.** A match's state is said in one place per screen, and that place names the station.
- **Room-sized.** The numbers people read from 2–3 m or across the room fill the space they're given; projector labels are readable from the back.

## Tickets

1. `01-violet-one-signal.md`: violet only for state (P1), DESIGN.md amended
2. `02-one-owner-per-match.md`: each match's state in one place on the knockout screens (P1)
3. `03-score-fills-card.md`: the remaining score sized to its card (P1)
4. `04-phone-admin-wide-content.md`: brackets and tables usable at 390 px (P2)
5. `05-projector-big-moments.md`: game shot, champion and idle fill the projector (P2)
6. `06-small-inconsistencies.md`: the minor list from the re-critique (P3)
7. `07-room-check-and-recritique.md`: the real kiosk and projector, then a re-critique

## For every ticket

As in ui-slop: the visual suite changes on purpose (check every changed shot, new baseline in the same commit); all checks pass; browser tests updated, not deleted; `docs/ui-pages.md` and `DESIGN.md` kept in step.

## Out of scope

Bulk admin actions (declined in ui-slop 06), a phone layout for /watch, a light theme, a new visual world.
