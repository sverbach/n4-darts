# A top progress bar while a page loads its data

Status: done
Type: task

Since web-router 02 pages change without a reload, so nothing shows that a page is still waiting for its data. A thin bar along the top of the window shows it, app-wide.

## Decisions (with the user, 2026-11-01)

- **nprogress**, pinned exactly, styled with our own CSS (no default stylesheet, no spinner): a thin Mecha Violet bar at the top, square, no glow.
- **What counts as loading:** page data only. A `useFetch` read, and the first view of each `useLive` stream after a page opens or its URL changes. Not saving changes, not reconnects.
- **Where and when:** every page (station, /watch and /display included), shown only when loading takes longer than 200 ms, so fast LAN loads never flicker.

## What to do

- A small loading counter in `lib/` that `useFetch` and `useLive` report to; the bar starts when the counter has been above zero for 200 ms and finishes when it drops to zero. Unit-tested with fake timers.
- The bar's CSS in `app.css` from the colour tokens.

## Acceptance

- A slow page load shows the bar; a fast one doesn't.
- All checks pass; the visual suite unchanged (loads there are fast).
- DESIGN.md mentions the bar (Components, Motion).

## Comments

2026-11-01: Decided with the user.

2026-11-01: Built. `nprogress@0.2.0` (and `@types/nprogress@0.2.3`), pinned; no default stylesheet, our bar in `app.css` (3px, `--accent`, fixed at the top), spinner off. `lib/loading.ts`: `createLoading(bar, delay)` counts pending loads and starts the bar once one has been pending for 200 ms, finishing when the last ends (unit tests with fake timers: under 200 ms nothing, overlapping loads one bar, an end counted once). `useFetch` reports each read; `useLive` reports until a stream's first view (or its failure, or leaving the page). Checked against the dev server: a normal /display load shows nothing; /players with its stats delayed 1.2 s shows the bar from about 250 ms until the data arrives. Visual suite unchanged. Bundle: 360,962 → 365,872 bytes. DESIGN.md: Components, "Loading Bar".
