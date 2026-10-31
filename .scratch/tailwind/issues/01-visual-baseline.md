# A screenshot of every page, before anything changes

Status: done
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

2026-10-31: Confirmed by the user.

2026-10-31: Built. `packages/e2e/tests/visual.spec.ts` with its own `playwright.visual.config.ts` (`pnpm --filter @n4/e2e visual`); `pnpm e2e` ignores it (`testIgnore`) and still runs its 13 tests.
- **66 screenshots**, baseline in `tests/visual.spec.ts-snapshots/` (2.7 MB): home, players, profile; admin PIN, players (+ photo editor), stations (+ board menu), matches (+ detail), diagnostics, tournament draft / groups / knockout / finished; station new match (+ picked), lineup, visit, correcting, game shot; watch visit and game shot; display without tournament, groups, knockout, finished. Pages at 390 and 1440 px, `/watch` and `/display` also at 1920×1080 and 1280×720.
- **Deterministic data:** the start script seeds six players with fixed ids when `N4_E2E_PLAYERS` is set (avatar colours come from the id). One story in order, every dart fixed; the tournament runs on station 1 only (a quick match of two players outside it keeps station 2 busy).
- **No masks:** right before each screenshot, text the server stamps with the real time is overwritten with fixed text (dates, times, the duration estimate; on diagnostics every digit), so the layout around it is still compared. Masks moved with the text's width and made screenshots differ by a few pixels; overwriting doesn't. Nothing depends on class names. Browser clock pinned, locale en-GB, time zone Europe/Zurich, animations off.
- **Stable:** three runs in a row pass at zero tolerance. **Red-capable:** changing `--accent` in `tokens.css` fails the first screenshot; restored, passes.
- **Found an existing bug** (recorded as-is in the baseline, not fixed here): on `/display`'s final placings at 1920×1080, a shared place like "3–4" wraps and its "4" overlaps the next row.
- Docs: README (e2e section) and 8.7.
