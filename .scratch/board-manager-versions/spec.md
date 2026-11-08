# Board Manager versions: 2.1 support, and how we add the next one

Status: ready-for-agent

The app reads only Board Manager **2.0.2**'s messages. When a board was updated to 2.1.0 (2026-11-06), every dart was rejected and the room downgraded. The app should support several versions side by side, and adding one should be a known routine that starts with recording what the new version really sends, not with guessing.

What 2.1.0 changed, as seen on the real board (2026-11-06; to be confirmed by a recording):
- **A dart is flat:** `{bed, bouncer, coordsX, coordsY, failed, method, multiplier, segmentName, segmentNumber}` instead of `{bouncer, coords: {x, y}, segment: {bed, multiplier, name, number}}`. `failed` and `method` are new and unexplained.
- **Names are camelCase:** events `throwDetected`, `takeoutStarted`, `takeoutFinished`; statuses `throw`, `takeout`, `takeoutInProgress` (2.0.2: "Throw detected", "Takeout in progress" and so on).
- The order of events is the same.

## Decisions (2026-11-08)

- **Supported: 2.0.x and 2.1.x**, picked per board by its `major.minor` from `GET /api/version`, read on every (re)connect. Boards on different versions can play in the same room. Dropping a version later is a deliberate step with its own ticket.
- **One adapter per version.** The gateway turns each version's snapshot into the one internal shape it uses today (`BoardSnapshot`, `BoardThrow`), so everything past the gateway stays as it is. An adapter is a Zod schema plus a mapping, in `board/versions/`.
- **An unknown version is refused, clearly.** The station shows "Board Manager 2.2.0 isn't supported" instead of "Board online" and accepts no darts from the board; Diagnostics says the same with the version. Darts added by hand on the station still work, so a match can go on by hand.
- **The process for a new version**, kept in `docs/board-manager-api.md`:
  1. **Record** with the recorder (below) on a real board, following its checklist.
  2. **Compare** with the last supported version's recording; write the differences into the API doc, one section per version.
  3. **Adapt:** an adapter and its replay test (the recording through the gateway gives the expected board events), and the simulator learns the version.
  4. **Check** on the real board (a human ticket), then the README's badges say it's supported.
- **The recorder** is a Node CLI in `tools/board-recorder`, run from any machine on the LAN (`pnpm board:record http://192.168.1.139:3180`). It saves `/api/version`, `/api/config`, the first `/api/state` and every WebSocket message, with times, to `recordings/<version>/<date>-checklist.txt`, in the format the simulator already replays. It walks the thrower through a checklist one step at a time and marks each step in the file: single inner and outer, double, treble, outer bull, bull, an off-board miss, a bounce-out, takeouts after 1, 2 and 3 darts, a manual reset, stop and start, and calibrate. It replaces `prototypes/listen-board.ps1`, and the recordings move from `prototypes/recordings/` to `recordings/`.
- **The simulator** emulates a chosen version (`--board-version 2.1`, default the newest), so dev, e2e and the visual suite can run against either.

## Out of scope

- Versions before 2.0.
- Detecting a version from the message shape instead of `/api/version`.
- Using 2.1's new `failed` and `method` fields for anything, until the recording shows what they mean.

## Tickets

1. `01-recorder.md`: the recorder and its checklist (agent)
2. `02-record-2-0-and-2-1.md`: record 2.0.2, then 2.1.x, on the real board (human)
3. `03-version-adapters.md`: the gateway reads `/api/version` and goes through a 2.0 adapter; unknown versions are refused (agent)
4. `04-board-manager-2-1.md`: the 2.1 adapter, the simulator's 2.1 mode, the API doc's 2.1 section (agent)
5. `05-docs-and-process.md`: ADR, the process in the API doc, README badges (agent)
6. `06-real-board-check.md`: a match on 2.1 and one on 2.0 in the same room (human)
