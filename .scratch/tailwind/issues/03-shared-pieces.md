# The shared pieces in Tailwind

Status: done
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

2026-10-31: Confirmed by the user ("go straight through 03–08").

2026-10-31: Built. `base.css`, `avatar.css` and `components.css` are gone.
- **Element defaults** (`body`, `h1`–`h3`, links, focus ring, `button`, `input`, `select`, range, `details`) moved unchanged into `@layer base` in `styles/app.css`.
- **Shared pieces as utilities** (`@utility` in `app.css`): `label`, `hint`, `match-label`, `primary`, `cta`, `ghost`, `danger`, `status` + `status-ok|warn|danger|accent`, `error`, `notice`, `panel`, `settings`, `group-table`, `table-scroll`, `back`, `inline-form`, `avatar-frame`. Decision: these are used 200-odd times and fine-tuned by the page sheets; inlining 5–15 utilities at every use would be the repetition Tailwind's docs advise against, and as utilities they keep their names, work with variants and sort like any utility. The status tones were renamed (`ok` → `status-ok`, …) because `danger` is also a button variant.
- **Components in utilities:** `PixelIcon`, `Logo` / `SparkleLogo` (keyframes in `app.css`, `motion-reduce:animate-none`), `Avatar` (`--size` from `--avatar`, clip-path as an arbitrary property), `PlayerPicker`, `SegmentPicker`, `BoardMenu` (`BoardStatus` takes a `className`). `wide-only` / `narrow-only` became `max-kiosk:hidden` / `kiosk:hidden` everywhere.
- **Markers kept:** where a page sheet still targets a class (`pixel-icon`, `logo`, `logo-sparkle`, `avatar`, `large`, `avatar-initials`, `narrow-only` on the stats page, `checkout`), the element keeps the name, unstyled, until that page's ticket removes the rule.
- **Cascade change, one place:** in a layer, `cta` no longer beats page rules on specificity. `.next-player`'s phone padding and its kiosk slant and min-height had always lost to `button.cta`; now they'd have won. They were dead, so they're removed from `station.css`. `settings` turned out to be shared (the tournament draft uses it too), so it's a utility rather than inline in `SettingsFields`.
- **Checks:** visual suite at zero tolerance, all 66 screenshots; no class of ours clashes with a generated utility. All checks pass. The routing test's stub markers changed from `[…]` to `@@…@@`, since class names now contain brackets.
- **Visual suite:** screenshot checks are now soft, so a run lists every differing screenshot.
- CSS bundle 91.95 kB (gzip 24.44 kB), up from 89.58 kB: old sheets and new utilities overlap until ticket 08.
