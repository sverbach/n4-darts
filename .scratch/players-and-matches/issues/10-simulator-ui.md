# Board simulator UI

Status: done
Type: task

Make it easy to test the whole system end to end without a real board: a page served by the simulator itself where you click a dartboard to throw darts. Independent of the other tickets.

## Page

Served by `tools/board-sim` at `GET /` on the simulator's own port (e.g. `http://localhost:3180/`). One self-contained HTML page with inline CSS/JS and an inline SVG board: no build step, no CDN, nothing from the internet (ADR-0005). It doesn't depend on `packages/web`. Plain styling, works on a phone.

- **Clickable board**: an SVG dartboard drawn from the same segment order and ring radii as `throws.ts`. A click becomes a throw at those exact normalised coordinates, with the right segment (inner/outer single, double, triple, outer bull, bull). Clicking outside the double ring is a miss next to the nearest number. Hovering highlights the segment and shows its name.
- **Darts on the board**: markers where the current darts landed, plus a list of the three with their names. Click a listed dart, then click the board, to revise it (`reviseDart`), so corrections coming from the board can be tested.
- **Buttons**: Takeout, Bounce-out, Reset (an outside reset as if pressed on the laptop, handy for ticket 08), Stop / Start, Online / Offline toggle.
- **Quick keys** (optional, nice to have): type a notation such as `T20`, `D16`, `BULL` and press enter to throw it, reusing `throwFor`.
- **Live state**: the page follows the board over the existing `/api/events` WebSocket and shows status, event, darts and whether the server is connected. It must keep working when the sim is offline. Control requests go through `/sim/*`, so add `/sim/reset`, `/sim/stop`, `/sim/start`, `/sim/bounce` and `/sim/state` as needed, and a revise route that takes coordinates.

## Several boards

- `pnpm sim --boards 2` starts boards on consecutive ports (3180, 3181, …). Each has its own page, and the page title says which port it is.
- Add a root script (e.g. `pnpm dev:sim`) that runs two simulators plus the server and web dev servers, with `STATIONS` pointing at both. Then `/station/1`, `/station/2`, `/admin` and both sim pages are all you need for a full e2e session on a laptop. Document it in the README.

## Acceptance

- Unit test: mapping clicked coordinates to segments matches `throwFor` for every number and ring, plus edge cases (bull, outer bull, miss).
- Test: `GET /` returns the page; the new `/sim/*` routes do what they say.
- Manual: with `pnpm dev:sim`, play a leg on `/station/1` by clicking the board in the sim page, including a revise, an outside reset and taking the board offline and back.
- typecheck, lint, test and build pass.

## Comments

**2026-10-18, done.** `page.ts` renders the page; the SVG board is generated from `ORDER` / `RINGS` in `throws.ts`, and `throwAt(coords)` turns a click back into a throw (same beds and names as `throwFor`). The page follows `/sim/events`, a separate WebSocket carrying `{ online, state, boardClients }` that keeps working while the board is offline. New routes: `GET /sim/state`, `POST /sim/reset|stop|start`; `/sim/dart` and `/sim/revise` accept `{ coords }` as well as `{ name }`. `pnpm sim --boards N`; root `pnpm dev:sim` runs two boards plus server and web with `STATIONS` set. The vite proxy now follows `PORT`, so `PORT=3100 pnpm dev:sim` works when 3000 is taken (e.g. by the Docker container).
- Ring sizes are fitted to the real recording: Board Manager puts the outside of the double ring at about 0.99, not 1 (a real D20 sits at radius 0.949). A test checks every recorded real dart maps back to the segment the board reported. `throwFor("D…")` now lands at 0.966.
- Checked in a browser against `pnpm dev:sim`: played visits on `/station/1` by clicking, revised a dart, outside reset mid-visit, offline and back; page fits a 390 px phone.
