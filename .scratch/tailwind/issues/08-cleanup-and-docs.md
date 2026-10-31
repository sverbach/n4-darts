# Only the theme and a small app.css left

Status: ready-for-agent
Type: task
Blocked by: 04, 05, 06, 07

Finish the migration (`../spec.md`): no page sheets left, preflight in its final state, docs up to date.

## Steps

- `styles/` holds only the theme (former `tokens.css`) and `app.css` (keyframes, reduced motion, base element rules, anything kept as CSS on purpose). `styles.css` imports Tailwind, the theme and `app.css`.
- If preflight was held back in ticket 02, turn it on now and fix what the visual suite shows.
- Search the markup for classes no rule defines any more (left over from the old sheets) and remove them.

## Acceptance

- No page sheets; `app.css` is short and each block says why it isn't utilities.
- The visual suite passes against the baseline from ticket 01.
- All checks pass. CSS bundle size before the migration (ticket 01's build) and now, noted in the comments.
- **Docs:** `docs/architecture/08-crosscutting-concepts.md` (8.6) describes the styling as it now is: Tailwind on the tokens' theme, Biome-sorted classes, what lives in `app.css`, projector scaling on `--px`. `docs/architecture/05-building-block-view.md` (5.2, web shared) lists `styles/` as it now is. `README.md` if it mentions the sheets.

## Comments
