# Tailwind set up, with the design tokens as its theme

Status: ready-for-agent
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
