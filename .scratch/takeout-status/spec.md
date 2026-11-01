# Show a takeout in progress, and a stuck one

Status: done

A takeout sometimes starts but never finishes: someone takes long to pull the darts, or the board doesn't see it empty. The board then stays in "Takeout in progress" and ignores new darts, but the station shows "Board online", so players think detection is broken.

The board already reports it (`status: "Takeout in progress"` between `Takeout started` and `Takeout finished`, `docs/board-manager-api.md`), and the gateway turns it into `TakeoutStarted` / `TakeoutFinished` events, but the station ignores `TakeoutStarted`, so no page knows.

## Decisions (with the user, 2026-11-01)

- **Look:** a neutral "Takeout…" pill while the takeout is ordinary; after **10 seconds** it turns amber, "Takeout stuck", and offers **Reset board** right there (the same action as in the ⋮ menu).
- **Where:** the station page only: its header pill, and "Taking out…" instead of "Remove darts" under the darts. Not admin, not the projector.

## Tickets

1. `01-station-knows-takeout.md`: the station tracks a takeout in progress and sends it to its pages
2. `02-takeout-pill.md`: the station's pill and visit line show it, stuck after 10 s with Reset board
3. `03-sim-held-takeout.md`: the simulator can start a takeout without finishing it (dev and browser tests)
