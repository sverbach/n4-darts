# Home and the stats pages in Tailwind

Status: needs-triage
Type: task
Blocked by: 03

Move the styles of home, the leaderboard and the profile (`pages.css`) into Tailwind classes, and delete `pages.css` (`../spec.md`). Nothing may look different.

## Steps

- Rewrite the classes of `App.tsx` (home) and `features/stats/` as Tailwind utilities on the theme's roles (no raw colours or font names).
- Anything that can't be a utility (keyframes, a selector that's clearer as CSS) goes to `styles/app.css`, with a line saying why.
- Remove `pages.css` and its import from `styles.css`.
- Run the visual suite after each larger step, not only at the end.
- The heatmap's board is drawn in SVG: keep its colours on the theme's roles.

## Acceptance

- `pages.css` is gone; no class from it is left in the markup.
- The visual suite passes at zero tolerance against the baseline from ticket 01, at every size. Any difference that's accepted instead is listed in the comments with a screenshot and the reason.
- `pnpm lint` passes, so every class list is sorted.
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Docs:** `docs/architecture/08-crosscutting-concepts.md` (8.6, "Styles") no longer lists `pages.css`.

## Comments
