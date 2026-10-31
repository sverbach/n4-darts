# The shared pieces in Tailwind

Status: needs-triage
Type: task
Blocked by: 02

Move the shared styles (`base.css`: elements, buttons, fields, pills, panels; `avatar.css`; `components.css`: picker, settings, segment picker, board menu) into Tailwind classes, and delete `base.css`, `avatar.css` and `components.css` (`../spec.md`). Nothing may look different.

## Steps

- Rewrite the classes of `components/` and the shared elements every page uses as Tailwind utilities on the theme's roles (no raw colours or font names).
- Anything that can't be a utility (keyframes, a selector that's clearer as CSS) goes to `styles/app.css`, with a line saying why.
- Remove `base.css`, `avatar.css` and `components.css` and its import from `styles.css`.
- Run the visual suite after each larger step, not only at the end.
- Element defaults (`body`, headings, `button`) that `base.css` sets globally stay global, as `@layer base` rules in `app.css` on the theme, rather than repeated on every element.

## Acceptance

- `base.css`, `avatar.css` and `components.css` is gone; no class from it is left in the markup.
- The visual suite passes at zero tolerance against the baseline from ticket 01, at every size. Any difference that's accepted instead is listed in the comments with a screenshot and the reason.
- `pnpm lint` passes, so every class list is sorted.
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Docs:** `docs/architecture/08-crosscutting-concepts.md` (8.6, "Styles") no longer lists `base.css`, `avatar.css` and `components.css`.

## Comments
