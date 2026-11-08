# The gateway reads the board's version and goes through an adapter

Status: ready-for-agent
Type: task
Blocked by: 01

## What to do

- On every (re)connect, `GET /api/version`; pick the adapter by `major.minor`.
- `board/versions/v2_0.ts`: today's schema and the mapping to `BoardSnapshot` (an identity, for 2.0). The gateway's diffing works on the internal shape only.
- An unknown version: no darts from the board, a `BoardUnsupported` state with the version; the station's status says "Board Manager 2.2.0 isn't supported", Diagnostics shows it. Darts added by hand still work.
- Diagnostics shows every board's version.
- A replay test: the 2.0.2 recording through the gateway gives the expected board events.

## Acceptance

- Nothing changes on a 2.0.2 board (the e2e and visual suites pass unchanged).
- A simulated 9.9 board is refused as above.
- All checks pass.
