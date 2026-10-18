# Handover

Context for picking this project up in a fresh Claude Code session (e.g. on another machine). Read this, then `docs/architecture.md`, `GLOSSARY.md` and `docs/adr/`.

## Where we are (2026-10-18)

- **Walking skeleton done** (`.scratch/walking-skeleton/`, tickets 01–07 all `done`): X01 engine, board simulator, board gateway, SQLite event log, station page. Played a real 301 match on the real board via Docker on the home server, including a restart mid-leg. Proof of concept accepted.
- **Board Manager API** is documented in `docs/board-manager-api.md`. Still unobserved: the bullseye's `bed`/`name` (the simulator guesses `Double`/`Bull`; scoring is `number × multiplier` so only the label is at risk) and camera error states.

## Next step

Spec the next build step from `docs/architecture.md`: **players, admin, tournaments and scheduler** (then `/display` and stats). Process the user wants:

1. Draft the big picture first (a spec under `.scratch/<feature>/spec.md`).
2. Then grill open questions in rounds, one frontier at a time, with a recommended answer per question.
3. Then break it into tickets under `.scratch/<feature>/issues/`.

Don't start coding before the user confirms.

**Design system:** the user has a Claude design (standalone Claude Design app, https://claude.ai/design/p/f9f184af-1ba4-480a-b70a-2363f065871f) that the real UI should follow. It couldn't be read yet; the user will provide it via `/design-sync`, a Design System artifact, or pasted tokens. The current `packages/web/src/styles.css` is placeholder styling.

## Working in this repo

- pnpm 12 isn't installed globally and corepack can't run it: use `npx -y pnpm@12.14.0 <cmd>` (`install`, `test`, `typecheck`, `lint`, `build`, `dev`, `sim`).
- Before committing: typecheck, lint, test and build must pass. Tests are Vitest, TDD at agreed seams (engine `matchState`, gateway against the simulator, station/server integration against the simulator).
- Commit and push to `main` on https://github.com/sverbach/n4-darts.git when a ticket is done; mark the ticket `Status: done` with a `## Comments` note.
- Deploy on the server: `git pull && N4_STATIONS=1=http://192.168.1.139:3180,2=http://<board2-ip>:3180 docker compose up -d --build`, then open `http://<server>:3000/station/1`.
- Default X01 is **301** single in / single out.

## Known gaps

- A reset pressed on the laptop mid-visit leaves darts in the log that the board has forgotten; needs the "darts lost" prompt from the architecture doc.
- Two devices driving one station at once is only covered server-side.

## User preferences

- Big picture first, then grill one round at a time; don't jump to decisions or code.
- Short, direct communication.
