# The projector pages in Tailwind

Status: done
Type: task
Blocked by: 03

Move the projector's styles (`display.css`: `/display` and `/watch`) into Tailwind classes, and delete `display.css` (`../spec.md`). Nothing may look different.

## Steps

- Also `styles/scoreboard.css` (moved out of `station.css` in ticket 04): the scoreboard cards (`PlayerCards`) and the game shot (`MatchOver`), shared by the station and `/watch`, together with the `.watch …` rules that adjust them; delete it too. Check a scoreboard of three or more players (`.many`) on both pages by hand: the visual suite only has two.
- Rewrite the classes of `features/display/` and `features/watch/` as Tailwind utilities on the theme's roles (no raw colours or font names).
- Anything that can't be a utility (keyframes, a selector that's clearer as CSS) goes to `styles/app.css`, with a line saying why.
- Remove `display.css` and its import from `styles.css`.
- Run the visual suite after each larger step, not only at the end.
- Decide how sizes on `--px` are written (arbitrary values like `text-[calc(48*var(--px))]`, or a few theme utilities) and use it throughout; write the choice down in the comments.
- Checked at 1920×1080 and 1280×720 as well as 390 and 1440 px.

## Acceptance

- `display.css` is gone; no class from it is left in the markup.
- The visual suite passes at zero tolerance against the baseline from ticket 01, at every size. Any difference that's accepted instead is listed in the comments with a screenshot and the reason.
- `pnpm lint` passes, so every class list is sorted.
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Docs:** `docs/architecture/08-crosscutting-concepts.md` (8.6, "Styles") no longer lists `display.css`.

## Comments

2026-10-31: Confirmed by the user ("go straight through 03–08").

2026-10-31: Built. `display.css` and `scoreboard.css` are gone.
- **`--px` sizes:** projector-unit utilities, defined once in `app.css` with Tailwind's functional `@utility` (`text-pu-*`, `tracking-pu-*`, `gap-pu-*`, `p*-pu-*`, `m*-pu-*`, `w-`/`h-`/`min-w-`/`min-h-pu-*`, `top`/`right`/`bottom`/`left-pu-*`, `border-pu-*`, `avatar-pu-*`): `gap-pu-16` is `calc(var(--px) * 16)`. Readable, and they work wherever a piece is rendered. Checked first that Tailwind 4.3 takes `gap-x-pu-16` next to its own `gap-x-*`. Grid columns in `--px` stay arbitrary values.
- **Shared pieces get a size:** `PlayerCards` and `MatchOver` take `size` (`station` / `projector`), `MatchCard` and `Awards` take `projector`. Station classes come from the station's rules, projector classes from the `.watch` / `.display` rules. On /admin, `MatchCard` and `Awards` keep their classes for `admin.css` (its rules are scoped to `.admin`) until ticket 07. `Progress`'s base rule (in `display.css`) is now its utilities; admin's override still applies.
- **Deliberate difference (3+ players, `/watch` only, not in the screenshots):** today's cascade let some station rules beat the `.watch` ones by specificity (e.g. the active player's name on `/watch` took the station's 15 / 26 px instead of 22 projector px). The projector size now uses the `.watch` values throughout. Checked by hand: a three-player match on the station (phone, kiosk) and `/watch` (1080p) looks as intended.
- **Leak kept on purpose:** the projector's leaderboard and group tables had a 10 px gap between avatar and name, not 14 projector px: `admin.css`'s unscoped `.table-player { gap: 10px }` always won there. The visual suite caught it; it's `gap-2.5` now, with a comment.
- **Lesson:** two utilities for the same property on one element (`border-solid` + `border-dashed`, `text-left` + `text-right`) don't resolve by class order. States set their own value instead (the dart tiles, the table cells; also fixed in the station's tiles).
- Visual suite: all 66 at zero tolerance. All checks pass. CSS 91.71 → 80.98 kB (gzip 24.63 → 23.60 kB).
