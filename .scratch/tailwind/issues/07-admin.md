# The admin area in Tailwind

Status: done
Type: task
Blocked by: 03

Move the organiser's area (`admin.css`, the largest sheet) into Tailwind classes, and delete `admin.css` (`../spec.md`). Nothing may look different.

## Steps

- Rewrite the classes of `features/admin/` as Tailwind utilities on the theme's roles (no raw colours or font names).
- Anything that can't be a utility (keyframes, a selector that's clearer as CSS) goes to `styles/app.css`, with a line saying why.
- Remove `admin.css` and its import from `styles.css`.
- Run the visual suite after each larger step, not only at the end.
- Large: split the work by tab (shell and PIN, tournament, players and photo editor, stations, matches, diagnostics) and run the visual suite after each tab.

## Acceptance

- `admin.css` is gone; no class from it is left in the markup.
- The visual suite passes at zero tolerance against the baseline from ticket 01, at every size. Any difference that's accepted instead is listed in the comments with a screenshot and the reason.
- `pnpm lint` passes, so every class list is sorted.
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Docs:** `docs/architecture/08-crosscutting-concepts.md` (8.6, "Styles") no longer lists `admin.css`.

## Comments

- Done in two commits (shell, stations, matches, tournament draft; then the running tournament, diagnostics, players and the photo editor). `admin.css` is deleted; the visual suite passes at zero tolerance, all 66 screenshots.
- Class lists the admin tabs share live in `features/admin/ui.ts` (sections, columns, cards, badges, the smaller status pill).
- Overriding one of our own utilities (`primary`, `cta`, `status`, `error`) without a variant needs `!`, e.g. `px-5! text-[13px]!`: both sit in the utilities layer, and the order between them isn't the class order.
- `MatchCard` and `Awards` now have an admin style next to the projector one; `Progress` takes a `className` (the running tournament's narrower bar).
- On the projector, admin.css's `.table-player { gap: 10px }` used to leak in; kept as `gap-2.5` in `DisplayPage.tsx` with a comment, so nothing moved.
- The photo editor's dimmed backdrop is a new token, `--scrim`, instead of a raw colour.
- CSS bundle: 85.50 kB before the migration, 67.97 kB now.
