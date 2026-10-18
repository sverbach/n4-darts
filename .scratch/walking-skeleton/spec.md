# Walking skeleton: one 301 leg on a real board

Status: ready-for-agent

## Goal

Prove the whole chain end to end with the thinnest possible slice: the server connects to one board, a player opens `/station/1`, and two players play one leg of 301 (single in, single out) with live scoring, a correction, and recovery from a server restart.

Read first: `docs/architecture.md`, `docs/board-manager-api.md`, `docs/adr/`, `GLOSSARY.md`.

## In scope

- pnpm workspace (`packages/engine`, `packages/server`, `packages/web`, `tools/board-sim`), Docker image.
- X01 engine (pure, tested): visit ends at takeout, bust, checkout, configurable in/out rules.
- Board simulator speaking the Board Manager API.
- Board gateway: snapshot diffing, reconnect, `start`/`stop`/`reset`.
- Per-match event log in SQLite; state rebuilt on startup.
- Bare `/station/1` page: start a leg, live scores, correct a dart in the current visit, manual "next player".

## Out of scope

Tournaments, players database, `/admin`, `/display`, `/watch`, multiple legs/matches, design system styling, stats.

## Done when

- `docker compose up` on the server, open `/station/1` on the laptop, play a full 301 leg on the real board.
- Killing the server mid-leg and restarting it resumes the leg exactly.
- A misdetected dart can be corrected from the station and scores update.
- The same leg can be played against the simulator in CI-style automated tests.
