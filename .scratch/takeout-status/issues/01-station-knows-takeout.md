# The station tracks a takeout in progress

Status: needs-triage
Type: task

The gateway emits `TakeoutStarted` and `TakeoutFinished` (`server/src/board/gateway.ts`); the station ignores the first.

## What to do

- The station keeps `takeout: boolean`: true on `TakeoutStarted`, false on `TakeoutFinished`, a board reset, a stop, or the board going offline.
- `StationView` gets `takeout` (`server/src/api.ts`); the station's live stream pushes a new view when it changes.

## Acceptance

- Station tests: started → true; finished, reset, stop and offline → false; the view is pushed on each change.
- Docs: `docs/architecture/06-runtime-view.md` if the takeout scenario lists what the station does.
