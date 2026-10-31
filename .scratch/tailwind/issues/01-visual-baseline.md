# A screenshot of every page, before anything changes

Status: needs-triage
Type: task

The safety net for the whole migration (`../spec.md`, "The screenshot suite"): a Playwright visual suite that puts the app into every page and state, and the baseline screenshots taken with today's CSS.

## Decisions

- **Where.** `packages/e2e/tests/visual.spec.ts`, with its own Playwright project (`visual`) so `pnpm e2e` and CI don't run it; run with e.g. `pnpm --filter @n4/e2e visual`. The baseline images are committed next to it (`visual.spec.ts-snapshots/`, darwin), so every later ticket compares against the same pictures.
- **Data.** Built by the suite through the API on the e2e server's fresh database: the fixed players from `fixtures.ts`, a few finished matches (so the leaderboard, a profile and its heatmap have content), a tournament in each state the pages show. Same data every run.
- **Determinism.** `page.clock` pinned to a fixed date and time before each page loads; `animations: "disabled"` and the caret hidden in `toHaveScreenshot`; masks only for what's live by nature (diagnostics' numbers). Photos: none, players show initials.
- **States and sizes** as listed in the spec. Each state is one `toHaveScreenshot` with a readable name (`station-visit-1440.png`).
- **Proven stable.** Run it three times in a row on unchanged code: all pass at zero tolerance. If something flickers, make it deterministic rather than raise the tolerance.

## Acceptance

- The suite covers every page and state in the spec at the listed sizes; the list of screenshots is in the comments.
- Three runs in a row pass on unchanged code.
- A deliberate one-line CSS change (e.g. a colour token) makes the affected screenshots fail with a visible diff; reverted.
- `pnpm e2e` and CI are unchanged (the visual project isn't in them).
- All checks pass.
- **Docs:** `README.md` (the e2e section) says how to run the visual suite and update its baseline; `docs/architecture/08-crosscutting-concepts.md` (8.7 Testability) mentions it.

## Comments
