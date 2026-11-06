# Party modes: docs

Status: ready-for-agent
Type: task
Blocked by: 01

## What to do

- **ADR 0012, "Party modes are persisted but never counted":** party matches use the same tables and event log as X01, so they survive restarts and corrections replay. Every finished-match query filters to X01. The consequences: no tournaments, no stats, and nothing visible once a match is finished. Add it to `docs/architecture/09-architecture-decisions.md`.
- **`GLOSSARY.md`** (and `docs/architecture/12-glossary.md` if it mirrors it):
  - **Mode, X01, party mode.**
  - **Round:** one visit by each player. Party modes only, so "round" stays out of X01 language.
  - **Target, target board, hole, mark, closed, killer, charge, lives, sudden death.**
  - The "Leg" and "Match" entries note that a party match is one game, with no legs.
- `docs/ui-pages.md`: the mode picker, the party scoreboards and the target board.
- `docs/architecture/05-building-block-view.md` / `06-runtime-view.md`: the mode dispatch in the engine and the X01 filter in stats.
