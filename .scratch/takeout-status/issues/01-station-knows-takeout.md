# The station tracks a takeout in progress

Status: done
Type: task

The gateway emits `TakeoutStarted` and `TakeoutFinished` (`server/src/board/gateway.ts`); the station ignores the first.

## What to do

- The station keeps `takeout: boolean`: true on `TakeoutStarted`, false on `TakeoutFinished`, a board reset, a stop, or the board going offline.
- `StationView` gets `takeout` (`server/src/api.ts`); the station's live stream pushes a new view when it changes.

## Acceptance

- Station tests: started → true; finished, reset, stop and offline → false; the view is pushed on each change.
- Docs: `docs/architecture/06-runtime-view.md` if the takeout scenario lists what the station does.

## Comments

2026-11-01: Confirmed by the user.

2026-11-01: Built. `StationView.takeout`: set on `TakeoutStarted`, cleared on `TakeoutFinished`, any board reset (the server's own included), start/stop and offline; taken from the snapshot's status when the board comes online (a server started mid-takeout). A laptop reset mid-visit now also pushes the view. Station tests for each. The load test counted one station message per change; a takeout is now two visible changes (started, finished) for one write, so it counts takeout starts on the streams but not as writes. The runtime view (06) has no step for a takeout start, so it stays.
