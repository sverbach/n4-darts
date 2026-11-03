# Lights in the docs

Status: done
Type: task
Blocked by: 03, 04

## What to do

- `pnpm dev:sim` also starts a fake WLED; README explains it and the Lights tab.
- Architecture: context (WLED as a neighbour system), building blocks (lights module), runtime (an event to a preset), deployment; ADR 0009 (WLED's JSON API directly, fire-and-forget).

## Comments

2026-11-03: Done. `pnpm dev:sim` starts the fake WLED on :3190 (its package has a `dev:sim` script, which the root one runs). README: the fake WLED in the table, a "Lights" paragraph (Admin → Lights, testing, diagnostics) and a "WLED simulator" section. ADR 0009 (WLED's JSON API directly, fire-and-forget). Architecture: context (WLED as a neighbour, its channel), building blocks (the `lights/` component and its diagram, Admin → Lights, wled-sim), runtime 6.7 (a game shot lights up the room), deployment (WLED on the LAN, its trust), the decisions table. ui-pages: `/admin/lights`, the Lights section of diagnostics, the tab list. Glossary: light event, base preset.
