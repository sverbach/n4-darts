# Tailwind set up, with the design tokens as its theme

Status: done
Type: task
Blocked by: 01

Add Tailwind v4 next to the existing sheets, without migrating anything yet (`../spec.md`, "Approach").

## Steps

- Add `tailwindcss` and `@tailwindcss/vite` (exact, at-least-two-weeks-old versions) and the Vite plugin.
- Turn `styles/tokens.css` into the `@theme`: colour roles, fonts, the 760 px breakpoint (as Tailwind's `sm`, or a named one like `kiosk`; pick one and write it down). The CSS variables keep their names, so the old sheets keep working.
- Decide preflight: run the visual suite with it on. If anything changes, import Tailwind's layers so the old sheets win (or skip preflight until the cleanup ticket), and note what changed.
- Biome: `nursery/useSortedClasses` at `error`. Check it sorts Tailwind v4 classes correctly in our patterns (plain strings, template strings, conditionals). Decide on `clsx` (or none) for conditional classes and configure the rule's `functions` for it.
- One trivial real use to prove the pipeline: e.g. a utility on one element that already has the same style, screenshots unchanged.

## Acceptance

- `pnpm build` produces the Tailwind CSS in the bundle, with no request leaving the room (ADR 0005).
- The visual suite passes against the baseline.
- `pnpm lint` fails on an unsorted class list and `pnpm format` fixes it (proven, reverted).
- All checks pass. Bundle size (CSS and JS) before/after noted in the comments.
- **Docs:** `docs/architecture/08-crosscutting-concepts.md` (8.6) says the tokens are Tailwind's theme and the rule for conditional classes; `docs/architecture/04-solution-strategy.md` (4.1) lists Tailwind.

## Comments

2026-10-31: Confirmed by the user.

2026-10-31: Built. `tailwindcss` and `@tailwindcss/vite` 4.3.3 (16 Jul, exact), Vite plugin added.
- **Theme** (`styles/theme.css`): `@theme inline` maps every colour role to its token (`--color-surface: var(--surface)`, 31 roles), so `tokens.css` stays the one place for values. Tailwind's colours, fonts and breakpoints are cleared (`--color-*: initial` etc.): only our roles, `font-pixel` / `font-text`, and the breakpoint `kiosk` (760 px; `max-kiosk:` for below). The two font stacks moved from `tokens.css` into a plain `@theme`: inline would have emitted `--font-pixel: var(--font-pixel)`, a variable pointing at itself.
- **Preflight held back:** with it on, the home page's logo rescaled (its image rules). `styles.css` imports only `tailwindcss/theme.css` and `utilities.css` in layers; the old, unlayered sheets win over utilities. Ticket 08 turns preflight on.
- **First real use:** the home footer's rule moved from `pages.css` to utilities on the element. It first came out 3 px off: `border-solid` makes all sides solid at the default 3 px; `border-0` first fixed it. Lesson added to the spec.
- **Biome:** `nursery/useSortedClasses` at `error` with a safe fix, so `pnpm format` sorts. Probed on plain strings, template strings with conditions and `clsx(…)`: all sorted, our own class names kept first in their order. So **no `clsx`**: conditional classes stay template strings. Biome doesn't read our config and puts the custom `kiosk:` variant first; harmless. `css.parser.tailwindDirectives` on, so Biome parses `@theme`.
- **Name clashes found:** the build generated 18 utilities, 10 of them unintended, from words in the source. Two were our own class names on elements: `grid` (chart grid lines) and `ring` (heatmap rings), renamed to `chart-grid` and `board-ring` (SVG, so no visible effect, but traps). Lesson added to the spec.
- The visual suite passes against the baseline (preflight check, footer, renames); all checks pass; no URL in the CSS leaves the room.
- **Bundle:** CSS 85.50 → 89.58 kB (gzip 22.96 → 23.79 kB), JS unchanged (321.2 kB).
- Docs: 8.6 (Tailwind, theme, sorting, borders without preflight), 4.1.
