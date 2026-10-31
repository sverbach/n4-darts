# Move the server modules into component folders

Status: done
Type: task

Move `packages/server/src` into the layout in `../spec.md`: one folder per cluster, with each module's unit and component tests next to it. Pure move: no behaviour or API changes.

## Steps

- `git mv` each module and its `*.test.ts` into its folder; `tournament/` becomes `tournaments/plan/`.
- Leave `main.ts`, `app.ts`, `api.ts` and `db.ts` at the top, and the tests ticket 02 moves (`app`, `overrides`, `resultChanges`, `withdrawals`, `load`, `tournament.e2e`, and `seed.ts`) where they are for now.
- Fix every import, in the server and in the tests.
- Check what else names the old paths: `package.json` exports, the Dockerfile, `packages/e2e` (a comment names `load.test.ts`), comments in the code, `README.md`, `docs/`.

## Acceptance

- `packages/server/src` has only `main.ts`, `app.ts`, `api.ts`, `db.ts`, the files ticket 02 moves, and the component folders.
- No `index.ts` barrels.
- `pnpm build` still produces `dist/main.js` and `dist/api.js`, and the Docker image starts (`docker compose build` then `up`, or `node packages/server/dist/main.js` against the simulator).
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Architecture docs updated:** the module table and diagram in `docs/architecture/05-building-block-view.md` (5.2, white box server) show the folders; other paths in `docs/architecture/` follow.

## Comments

2026-10-31: Confirmed by the user as written.

2026-10-31: Built. 37 files moved with `git mv` by a script that maps old to new paths and rewrites each relative import against the file's old location. Folders: `board/`, `stations/`, `players/` (with `photos.test.ts`), `matches/`, `tournaments/` (with `plan/`, formerly `tournament/`), `scheduling/`, `ratings/`, `stats/`, `live/`, `access/`, `operations/`. `db.test.ts` stays with `db.ts` at the top.
- Typecheck was clean straight after the move; Biome changed nothing.
- `dist/` rebuilt from scratch: `dist/main.js` and `dist/api.js` are where `package.json` and the Dockerfile expect them. The built server started against a simulated board, connected to it and served the web app.
- All checks pass, 455 tests as before.
- Docs: the 5.2 module table now has a folder column, the diagram's `tournament/` node is `plan/`, and the two full paths in `01-introduction-and-goals.md` follow. Bare file names elsewhere in the docs still hold.
