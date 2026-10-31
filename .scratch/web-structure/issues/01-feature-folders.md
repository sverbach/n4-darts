# Move the web app into feature folders

Status: done
Type: task

Move `packages/web/src` into the layout in `../spec.md`: `features/` per page (with `admin/` and its tabs), `components/` and `lib/` for what more than one feature uses. Pure move and extraction: no behaviour, markup or style changes.

## Steps

- Create the folders and move each page's files into its feature (`git mv`, so history follows).
- Pull the shared pieces listed in the spec's table out of their feature files into `components/` and `lib/`. Only what another feature imports moves.
- `adminApi.ts`'s `request` becomes `lib/api.ts`.
- Fix every import; keep `main.tsx`, `App.tsx` and `styles.css` at the top of `src/`.
- Check nothing else points at the old paths: the Vite config, `index.html`, the e2e tests, `README.md`, and comments in the code.

## Acceptance

- `packages/web/src` has only `main.tsx`, `App.tsx`, `styles.css` and the folders `features/`, `components/`, `lib/`, `styles/`, `assets/`.
- No file in `features/<a>/` imports from `features/<b>/` (checked by hand here; ticket 02 makes the linter check it). `admin/` and its tabs count as one feature.
- No `index.ts` barrels.
- All checks pass (types, lint, tests, load test, browser tests, build). The browser tests cover the station, the board menu and a quick match; the other pages are checked by loading them in the dev server against the simulator (`pnpm dev:sim`): `/`, `/station/1`, `/watch/1`, `/display`, `/players`, a profile, and every `/admin` tab.
- **Architecture docs updated:** the web table in `docs/architecture/05-building-block-view.md` (5.2) lists the new paths and the shared files, and `README.md`'s layout table, if it names web files.

## Comments

2026-10-31: Confirmed by the user as written.

2026-10-31: Built. Files moved with `git mv`; shared pieces extracted into `components/` (`PlayerPicker`, `PlayerCards`, `MatchOver`, `Awards`, `MatchCard` with its `STATUS` labels, plus `Avatar`, `Logo`, `PixelIcon`, `Progress`, `BoardMenu`, `SegmentPicker`) and `lib/` (`api.ts` from `adminApi.ts`, `labels.ts` with `legsLabel` and `rulesLabel`, `usePlayers.ts`, `useLive.ts`, `useStation.ts`, `darts.ts`).
- One more shared piece than the spec listed: `useStation` is used by the station and watch pages, so it's in `lib/`.
- `SettingsFields` and `Scoreboard` stay in the station (only it uses them). `TournamentRun` keeps `fixtureResult` and imports `STATUS` from `components/MatchCard.tsx`.
- No cross-feature imports (checked with a script over `features/**`), no barrels. Lint warnings back to the 20 from before (the move left unused imports, removed).
- All checks pass. Every page loaded against the simulator at 390 and 1440 px with no console errors: `/`, `/station/1`, `/watch/1`, `/display`, `/players`, a profile, and all five `/admin` tabs.
- `docs/architecture/05-building-block-view.md`: the web white box now lists the feature folders, the rule, and what's in `components/` and `lib/`. `README.md` names no web files, so it's unchanged.
