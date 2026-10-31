# 4. Solution strategy

The few ideas the design rests on, and which quality goal (section 1.2) each one serves.

| Idea | How | Serves |
|---|---|---|
| **Autodarts detects, n4-darts decides** | A board is only a source of darts and takeouts. Scoring, matches and tournaments are ours, behind one gateway per board (ADR 0001). | Correct scores, reliable evenings |
| **Match state is folded from an event log** | Every dart, correction and command is appended to the match's log in SQLite; the state is `fold(rules, events)`. Nothing is overwritten, a restart replays the log, and each match keeps its rules version (ADR 0002). | Correct scores, reliable evenings |
| **A visit ends at takeout** | Not at the third dart, a bust or a checkout, so a dart is never given to the wrong player (ADR 0003). | Correct scores |
| **Pure rules, shared by server and browser** | The engine has no I/O, no clock and no database. It runs on the server and in the browser, and is tested on its own (ADR 0006). Tournament plans are pure too: the whole plan follows from config, entrants and results. | Correct scores, safe to change |
| **One server in the room, nothing on the laptops** | One process holds the boards, the matches and every view. The laptops only run the Board Manager and a kiosk browser. | Reliable evenings, deployability |
| **Live by default** | One change feed hears every database write and station change; each SSE stream recomputes its view and sends it only when it changed. No polling. | Instant at the board |
| **No logins** | Stations are URLs; any number of devices can show or control one. The organiser's area is behind a shared PIN (ADR 0004). | Usable from where you stand |
| **Fully offline** | Fonts, icons and everything else are bundled; nothing is fetched at runtime (ADR 0005). | Reliable evenings |
| **A simulator for the board** | `tools/board-sim` speaks the Board Manager's protocol, so everything is developed and tested without a real board, up to load tests and browser tests. | Safe to change |

## 4.1 Stack

- **TypeScript** end to end, in a pnpm workspace: `packages/engine`, `packages/server`, `packages/web`, `packages/e2e`, `tools/board-sim`.
- **Server:** Node 24 with Fastify; SQLite through Node's built-in `node:sqlite`.
- **Web:** React with Vite, served as files by the same server.
- **Tests:** Vitest for unit, integration and load tests; Playwright for browser tests.
- **Packaging:** one Docker image, one `docker-compose.yml`, one volume. CI publishes the image on every green push to `main`.
- **Laptops:** Chrome or Edge in kiosk mode, autostarting `http://<server>/station/<n>`.
