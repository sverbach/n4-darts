# The projector pages in Tailwind

Status: ready-for-agent
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
