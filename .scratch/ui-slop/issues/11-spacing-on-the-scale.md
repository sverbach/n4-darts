# Spacing on the scale, equal insets, one pill height

Status: ready-for-agent
Type: task

The scale is 6 / 8 / 12 / 16 / 24 px (10 inside pills and notices, DESIGN.md). Off it:

- `gap-5` / 20px: StationPage ×3, StatsPages ×2, TournamentRun ×2, PhotoEditor; `px-5`: `admin/ui.ts:30`, MatchHistory, TournamentRun.
- `gap-7` / 28px: `admin/ui.ts:14,17`, `HomePage.tsx:17,22`, TournamentAdmin; `gap-x-10` / 40px (`ui.ts:14`), `gap-x-8` (HomePage:22).
- 14px (`*-3.5`): `ui.ts:37-38,47`, BoardMenu, `StationPage.tsx:196`, profile tiles.
- One-offs: `px-[18px]` (`MatchesAdmin.tsx:57`), `py-[18px]` (`StationPage.tsx:366`, TournamentRun), `p-[22px]` (StationsAdmin), `gap-[18px]` (`StationPage.tsx:136`, TournamentAdmin, TournamentRun), `py-[7px]` (MatchCard), `gap-[3px]` (StatsPages); page padding 36/40/48px; `pt-10` / `kiosk:pt-[72px]` (HomePage:17).
- The Matches tab has no gap between Stations and History (`features/admin/matches/MatchesAdmin.tsx:21`, the wrapper `<div>`).
- Equivalent cards have different insets: `px-4 py-3.5` (tournament) vs `px-[18px] py-4` (matches).
- Status pills in four heights: `min-h-[26px]` 10px (`MatchesAdmin.tsx:65`), `STATUS_SMALL` `min-h-6` (`ui.ts:53`), the default 30/36px, and the diagnostics "ONLINE" badge.

## What to do

- Snap every value to the scale. Decided: 24 px is the largest step; page padding and section gaps use it too (no 28/32/36/40/48). Section gaps between admin sections one value everywhere.
- One card inset for all admin cards.
- Status pill in two sizes at most (default, small), both in `app.css`; DESIGN.md says which is for what.

## Acceptance

- `grep` for arbitrary `[..px]` spacing and `-3.5` / `-5` / `-7` steps in `packages/web/src` finds only documented exceptions (projector `pu-*` units are fine).
- DESIGN.md spacing tokens match.
- See `../spec.md` "For every ticket".

## Comments

2026-10-31: Confirmed by the user. Largest spacing step 24 px.
