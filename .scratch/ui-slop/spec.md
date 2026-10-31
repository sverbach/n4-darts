# Say everything once, on the system's rhythm

Status: ready-for-agent

Follow-up to the Impeccable critique of 2026-10-31 (`packages/web/.impeccable/critique/2026-10-31T16-20-39Z__packages-web-src.md`, score 27/40). The UI's look is its own (`packages/web/DESIGN.md`), but screens say the same fact 3–5 times, spacing has drifted off its scale, and the accent and status colours are used outside their roles. Decided with the user (2026-10-31): fix **everything** the critique listed, **repeated information first**, and **game shot shows the result**.

Read first: `packages/web/PRODUCT.md`, `packages/web/DESIGN.md`, `docs/ui-pages.md`, `GLOSSARY.md`.

## The rules the tickets apply

- **Say it once.** A fact appears once per screen, in the place it's read. A second mention needs a reason (e.g. it's new information, like "Up: Bob").
- **Ok is silent.** Status shows when something needs attention; a healthy board says nothing in admin.
- **One format per kind of value.** Rules, totals, leg scores, dashes and pill wording read the same everywhere.
- **On the scale.** Spacing is 6 / 8 / 12 / 16 / 24 px (10 inside pills and notices), 24 the largest step; equivalent things have equal insets.
- **Roles stay roles.** Violet means active, selected or primary; green, amber and red mean status; the slant is the CTA; Dead Pixel is disabled.

## Order

Repeated information first (01–09), then layout (10–13), then colour and type (14–15), then the final pass (16). Each ticket is small enough to ship alone.

## Tickets

1. `01-one-turn-signal.md`: one turn signal on the station and watch
2. `02-rules-written-once.md`: the match rules written once, one way
3. `03-game-shot-shows-the-result.md`: game shot shows the result
4. `04-station-setup-repeats.md`: new match and lineup don't restate themselves
5. `05-tournament-repeats.md`: progress, rounds, champion and awards said once
6. `06-admin-quiet-when-ok.md`: admin is quiet when all is well
7. `07-match-history-repeats.md`: match history and detail say each fact once
8. `08-profile-and-brand-repeats.md`: profile, players and Home without repeats
9. `09-one-format-per-value.md`: one format for totals, scores, dashes and pills; better hints
10. `10-phone-overflow.md`: nothing overflows or clips on a phone
11. `11-spacing-on-the-scale.md`: spacing on the scale, equal insets, one pill height
12. `12-dead-space.md`: no dead space on the kiosk, projector, Home and profile
13. `13-home-live-stations.md`: Home shows what each station is doing
14. `14-colour-roles.md`: accent and status colours back in their roles
15. `15-type-scale.md`: every font size on the type scale, DESIGN.md tokens complete
16. `16-polish-and-baseline.md`: final polish, new visual baseline, re-critique

## For every ticket

- The visual suite (`pnpm --filter @n4/e2e visual`) **will** change: compare the diff, check every changed screenshot is meant, then take the new baseline with `--update-snapshots` in the same commit.
- All checks pass (types, lint, tests, load test, browser tests, build).
- Browser tests that look for removed text (e.g. "Throwing", "to throw") are updated, not deleted.
- `docs/ui-pages.md` is updated wherever a page's described content changes; `DESIGN.md` wherever a rule or component changes.

## Out of scope

New features beyond the critique (no bulk admin actions), a phone layout for /watch (big screens only), a light theme, changing the visual world.
