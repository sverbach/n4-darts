# Web app folder structure

Status: confirmed (2026-10-31).

`packages/web/src` is 27 files in one folder (about 4,500 lines), so the file list doesn't show which page a file belongs to. This moves them into feature folders, after the idea of feature-based React structures (e.g. https://dev.to/pramod_boda/recommended-folder-structure-for-react-2025-48mc), trimmed to what this app has. No behaviour changes.

## Target

```
packages/web/src/
  main.tsx, App.tsx, styles.css     entry, routing, the stylesheet's entry
  features/
    station/                        /station/n: StationPage, useStation, the quick-match screen
    watch/                          /watch/n: WatchPage
    display/                        /display: DisplayPage
    stats/                          /players, /players/:id: StatsPages, Heatmap
    admin/                          /admin: AdminPage (the shell and its tabs)
      tournament/                   TournamentAdmin, TournamentRun
      players/                      PlayersAdmin, PhotoEditor
      matches/                      MatchesAdmin, MatchHistory
      stations/                     StationsAdmin
      diagnostics/                  DiagnosticsAdmin
  components/                       UI used by more than one feature
  lib/                              non-UI code used by more than one feature
  styles/, assets/                  as now
```

## Decisions

- **Features follow the pages.** One folder per route, and `admin/` holds one sub-folder per tab. They match the web table in `docs/architecture/05-building-block-view.md` (5.2).
- **A feature never imports from another feature.** It imports from its own folder, `components/`, `lib/`, `assets/`, `@n4/engine` and `@n4/server/api`. Anything two features use moves to `components/` (UI) or `lib/` (everything else). `admin/` and its tabs count as one feature: `AdminPage` imports its tabs, and the tabs may import from `admin/`.
- **What moves out of the features, from today's imports:**

| Shared piece | Today in | Used by | Goes to |
|---|---|---|---|
| `Avatar`, `Logo`, `SparkleLogo`, `PixelIcon`, `Progress` | own files | most pages | `components/` |
| `BoardMenu`, `BoardStatus` | `BoardMenu.tsx` | station, admin stations, admin matches | `components/` |
| `SegmentPicker` | `SegmentPicker.tsx` | station, admin matches | `components/` |
| `PlayerPicker`, `usePlayers`, `legsLabel` | `MatchSetup.tsx` | station, watch, admin tournament, admin matches | `components/` (`PlayerPicker`) and `lib/` (`usePlayers`, `legsLabel`); `SettingsFields` stays in the station |
| `PlayerCards`, `MatchOver`, `rulesLabel` | `StationPage.tsx` | watch | `components/` (UI) and `lib/` (`rulesLabel`) |
| `Awards`, `MatchCard` | `TournamentRun.tsx` | display | `components/` |
| `request` | `adminApi.ts` | `BoardMenu` and the admin tabs | `lib/api.ts` |
| `useLive`, `dartLabel` | `useLive.ts`, `darts.ts` | most pages | `lib/` |

  Only what another feature actually imports moves; the rest of each file stays in its feature. Exact file names in `components/` and `lib/` are decided while moving, one export group per file, named after its main export.
- **No barrels.** No `index.ts` re-exports; imports name the file. Keeps "go to definition" and Vite's reloading direct.
- **No empty folders.** The article's `store/`, `context/`, `routes/`, `services/`, `types/` and `config/` don't apply: state comes live from the server, routing is a few lines in `App.tsx`, types come from `@n4/server/api` (ADR 0006), and there's no web-side configuration.
- **Styles stay global.** `styles/` keeps the design system's sheets as they are (`docs/architecture/08-crosscutting-concepts.md`, 8.6). CSS modules are a separate decision.
- **Big files stay big.** `StationPage` and `TournamentRun` only lose what another feature needs. Splitting them further is separate work.
- **Tests go next to their file** when the web package gets unit tests, as on the server. Nothing to move today: the web package is only tested through Playwright.
- **The rule is enforced by the linter.** Biome's `noRestrictedImports` in an override for `packages/web/src/features/**`, so `pnpm lint` (and CI) fails on an import into another feature.

## Out of scope

- The server's folder structure (a separate spec, next).
- Splitting big components, CSS modules, a router library.

## Tickets

1. `issues/01-feature-folders.md`: move the files into the target layout, shared pieces out of the features.
2. `issues/02-enforce-feature-imports.md`: the lint rule, and the docs.
