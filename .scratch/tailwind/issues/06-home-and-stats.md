# Home and the stats pages in Tailwind

Status: done
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

2026-10-31: Confirmed by the user ("go straight through 03–08").

2026-10-31: Built. `pages.css` is gone: home (`App.tsx`), the leaderboard and the profile (`StatsPages.tsx`) and the heatmap are utilities. `SparkleLogo` takes a `className` (its size), so the `logo-sparkle` marker is gone. The chart and the heatmap use `fill-*` / `stroke-*` on the theme's roles (`stroke-[0.004]` is ambiguous, so the board's line width is `[stroke-width:0.004]`).
- **Existing bug kept as is:** "Swipe table for more" under the leaderboard was meant for phones only (`narrow-only`), but `pages.css`'s more specific `.stats > .label.narrow-only { display: flex }` always won, so it shows on the kiosk too. The baseline has it; it stays, with a comment. Worth a one-line fix after the migration (`kiosk:hidden`).
- Links that set their own colour (the home's Watch link, station cards on the projector) get `hover:text-accent`: as utilities they'd otherwise beat the base layer's `a:hover`.
- Visual suite: all 66 at zero tolerance. All checks pass. CSS 80.98 → 77.26 kB (gzip 23.60 → 23.10 kB).
