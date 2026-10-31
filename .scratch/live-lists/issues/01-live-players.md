# Players live, in /admin and in every picker

Status: ready-for-agent
Type: task

`PlayersAdmin.tsx` fetches `/api/admin/players` once and again after its own changes; `lib/usePlayers.ts` fetches `/api/players` once per component. A player added at a station only shows in /admin, or in another open picker, after a reload (`../spec.md`).

## What to do

- Server: live streams for both lists, on the change feed with `streamView` like the other views: `/api/players/live` (what pickers need) and `/api/admin/players/live` (with ratings, archived players and photos, behind the PIN like the rest of `/api/admin`).
- Web: `usePlayers` reads `/api/players/live` with `useLive`; `PlayersAdmin` reads the admin stream. Both stop reloading after their own changes.
- The one-shot `/api/players` and `/api/admin/players` stay only if something else still uses them; otherwise remove them.

## Acceptance

- A player added at a station appears in /admin's player list and in an open picker on another device without a reload; a rename, archive or new photo in /admin shows in an open picker.
- Server tests for both streams (first view, and a new view after a change); a browser test for the cross-device case.
- The visual suite passes unchanged.
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Docs:** `docs/architecture/06-runtime-view.md` if a scenario lists how these lists load; `docs/architecture/05-building-block-view.md` (5.2) where it names `usePlayers`; the API list wherever the routes are documented.

## Comments

2026-10-31: Confirmed by the user.
