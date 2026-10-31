# Home's station list live

Status: done
Type: task

Home (`App.tsx`) fetches `/api/stations` once. A station added or removed in /admin only shows after a reload (`../spec.md`). The stream already exists: `/api/stations/live` (used by /admin matches).

## What to do

- Home reads `/api/stations/live` with `useLive`. If Home moves out of `App.tsx` into a feature folder on the way (`features/home/`), keep `App.tsx` as the route table only.
- Remove `/api/stations` if nothing else uses it.

## Acceptance

- A station added in /admin appears on an open Home page without a reload.
- A browser test for it.
- The visual suite passes unchanged.
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Docs:** `docs/architecture/05-building-block-view.md` (5.2) if Home moves.

## Comments

2026-10-31: Confirmed by the user.

2026-10-31: Built. Home moved out of `App.tsx` into `features/home/HomePage.tsx` (App.tsx is the route table only) and reads `/api/stations/live`. `/api/stations` stays: the stream sends the same list, and scripts use it. Browser test (`live.spec.ts`): a station added through /admin's API shows on an open home page and goes when removed. Visual suite unchanged.
