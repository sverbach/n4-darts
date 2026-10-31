# Tailwind CSS instead of the hand-written stylesheets

Status: draft (2026-10-31), for review.

The web app's look lives in 8 hand-written sheets under `packages/web/src/styles/` (about 5,400 lines), used through some 585 `className`s. This moves it to [Tailwind CSS](https://tailwindcss.com) v4, the default for modern web apps, with the design system's tokens as Tailwind's theme and Biome keeping the classes sorted. **Nothing may look different afterwards**: every page is screenshotted before the first change and compared after each step.

## Decisions (with the user, 2026-10-31)

- **All of it, area by area.** Not just set up for new code: every sheet is migrated and deleted, one area per ticket, each one checked against the screenshots.
- **Screenshots as the acceptance check.** A Playwright visual suite in `packages/e2e`, run on demand, not in CI: the baseline is taken on this Mac with today's CSS, and each ticket compares against it. Fonts render differently on Linux, so CI baselines would mean upkeep for no extra safety here.

## Approach

- **Tailwind v4** through its Vite plugin (`@tailwindcss/vite`), bundled at build time, so it stays fully offline (ADR 0005). Exact, at-least-two-weeks-old versions.
- **The tokens are the theme.** `styles/tokens.css` becomes Tailwind's `@theme`: every colour role (`--color-…`), the two fonts (Silkscreen, Geist Pixel), and the breakpoint at 760 px (the app's only one: phone below, kiosk and laptop above). Components use role names (`bg-surface`, `text-accent`), never raw colours, so a theme still only redefines the tokens (Q-11, `docs/architecture/08-crosscutting-concepts.md` 8.6).
- **Projector scaling stays.** `/display` and `/watch` size everything from `--px` (one pixel of the 1920×1080 mockup). Those sizes become arbitrary values on `--px` (e.g. `text-[calc(48*var(--px))]`) or a small set of theme utilities, whichever reads better; decided in the display ticket.
- **Biome sorts the classes.** `nursery/useSortedClasses` at `error` (with `fix`), so `pnpm lint` fails on unsorted classes and `pnpm format` sorts them. It's a nursery rule: check it understands Tailwind v4's utilities and our `className` patterns (template strings, conditional classes) before relying on it.
- **Conditional classes.** Today classes are toggled with template strings (`` `player ${active ? "active" : ""}` ``). With Tailwind's longer class lists, decide once (setup ticket) whether a tiny helper like `clsx` is worth it; Biome can sort inside it via the rule's `functions` option.
- **Old and new side by side.** During the migration both the remaining sheets and Tailwind are loaded. Tailwind's preflight (its CSS reset) can change how untouched elements look, so the setup ticket checks the screenshots with preflight on, and turns it off or layers it below the old sheets if it changes anything.
- **What can't be a utility stays CSS.** Keyframe animations (3 today), the reduced-motion rule, and anything that's genuinely clearer as a few lines of CSS stay in one small `app.css` next to the theme. The aim is no page sheets, not zero CSS.

## The screenshot suite

- **Pages and states:** home; station (idle, quick-match setup, lineup, a visit in progress with a correction open, game shot); watch; display (no tournament, groups, knockout, finished with awards); players; a profile with its heatmap; admin (PIN prompt, tournament draft, running, finished; players with the photo editor; stations with the board menu; matches with a match's detail; diagnostics).
- **Sizes:** 390 px (phone) and 1440 px (kiosk) for everything; 1920×1080 and 1280×720 for `/display` and `/watch`.
- **Deterministic:** a fresh database built by the suite through the API (fixed players, matches and darts), the clock pinned (`page.clock`), animations off, and anything that's live by nature (diagnostics' timings, "ends around …") masked. Two runs in a row on unchanged code must match exactly.
- **Comparison:** Playwright's `toHaveScreenshot` with a zero tolerance by default; any accepted difference is named in the ticket's comments with its reason.

## Out of scope

- Redesigning anything. Pixel-for-pixel the same.
- A light theme, client-side navigation, component libraries.

## Tickets

1. `issues/01-visual-baseline.md`: the screenshot suite and the baseline, on today's CSS.
2. `issues/02-tailwind-setup.md`: Tailwind, the theme from the tokens, Biome class sorting; nothing migrated yet.
3. `issues/03-shared-pieces.md`: `base.css`, `avatar.css`, `components.css`: `components/` and the shared elements.
4. `issues/04-station.md`: `station.css`.
5. `issues/05-display-and-watch.md`: `display.css`.
6. `issues/06-home-and-stats.md`: `pages.css`.
7. `issues/07-admin.md`: `admin.css`.
8. `issues/08-cleanup-and-docs.md`: no sheets left but the theme and `app.css`; docs.
