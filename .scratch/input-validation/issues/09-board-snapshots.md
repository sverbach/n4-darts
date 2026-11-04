# The Board Manager's snapshots parsed with Zod

Status: done
Type: task
Blocked by: 08

`board/gateway.ts` casts what the Board Manager sends: each WebSocket message is `JSON.parse`d and its `data` cast to `BoardSnapshot`, `GET /api/state` is cast the same way on a resync, and `toDetectedDart` casts the dart's multiplier to `Segment["multiplier"]`. The Board Manager's API is unofficial and can change with a vendor update (ADR 0001), so its answers are untrusted input like WLED's (08). A message that isn't JSON makes `JSON.parse` throw inside the WebSocket listener.

## Performance (measured 2026-11-04)

The gateway is on the dart path, so the cost was measured first, with a candidate schema against the 78 real snapshots in `prototypes/recordings/2026-10-18-board1.txt` (50,000 parses): `JSON.parse` alone takes 0.80 µs per message, and with Zod 1.07 µs. That's **0.28 µs added per message**, against a board that sends one every few seconds and a dart-to-screen budget measured in milliseconds. Negligible.

## What to do

- Zod schemas in `gateway.ts` for the message (`{ type, data }`), the snapshot and a throw, with `BoardSnapshot` and `BoardThrow` derived from them.
  - Plain `z.object` (unknown keys dropped, not refused), so a field the vendor adds doesn't break anything.
  - Only the fields the gateway uses are required (`event`, `status`, `running`, `throws`); `connected` and `numThrows` are optional.
  - `multiplier` is `0 | 1 | 2 | 3`, so `toDetectedDart` needs no cast.
  - The segment's `number` stays a plain number. The bullseye hasn't been observed yet (`docs/board-manager-api.md`), and a real dart mustn't be refused over a guess.
- **A live message that doesn't fit** (not JSON, or a `state` whose `data` doesn't parse) is dropped and counted. Every message is a full snapshot, so the next good one diffs in whatever was missed.
- **A resync answer that doesn't fit** fails the sync, which already closes the socket and reconnects with backoff.
- **Diagnostics:** `GatewayStats` counts rejected messages and keeps the last reason and time. `/admin/diagnostics` → Boards shows them next to "Last message", only when there are any, so the visual baseline doesn't change.
- `tools/board-sim`: `sendRaw(text)` sends any text as a board message, for the tests.
- Lint and docs: allow `zod` in `board/gateway.ts` like `lights/wled.ts`; ADR 0010 and section 8.8 name both device clients.

## Acceptance

- Gateway tests against the simulator:
  - a message that isn't JSON, a `state` without `throws` items that parse, and a multiplier of 4 are each counted, with the reason, and emit no events;
  - the next good snapshot still brings in the dart;
  - the server keeps running.
- A resync with a bad `/api/state` doesn't go online, and does once the state is good again. Skip this if the simulator can't serve a bad state without bigger changes; note why.
- The load test passes within its budget.
- All checks pass.

## Comments

2026-11-04: Built.
- **Schemas in `gateway.ts`:** `BoardThrowSchema`, `BoardSnapshotSchema` and `BoardMessage`, with `BoardSnapshot` and `BoardThrow` derived from them.
  - Plain `z.object`, so unknown keys are dropped (tested with a made-up `firmware` and `confidence`). `connected` and `numThrows` are optional.
  - `multiplier` is `0 | 1 | 2 | 3`, so the cast in `toDetectedDart` is gone. The segment's `number` is a plain number, as planned.
- **Live messages:** `JSON.parse` is in a `try`, so a message that isn't JSON no longer throws inside the WebSocket listener. A message without a `type`, or a `state` whose `data` doesn't parse, is dropped and counted. Messages of other types are ignored as before.
- **Resync:** a `GET /api/state` that doesn't parse, or isn't JSON, is counted with a `GET /api/state:` prefix and fails the sync, which closes the socket and retries with backoff. Tested: the gateway stays offline while the state is bad, and comes online once it's good.
- **Diagnostics:** `GatewayStats.rejected` (`count` and `last: { reason, at }`) goes through `BoardDiagnostics` to `/admin/diagnostics` → Boards. The page shows "· n dropped" in red after "Last message", with the reason as its tooltip, and only when n > 0, so the visual baseline is unchanged.
- **`tools/board-sim`:** `sendRaw(text)`.
- **Lint:** `zod` allowed in `board/gateway.ts` (`fastify` still banned there).
- **Docs:** ADR 0010 (device clients, unknown keys dropped, one message lost at most, the measured cost), 5.2 (the gateway's bullets, the linter list) and 8.8.
- **Tests** in `gateway.test.ts` ("what the board sends that doesn't fit"):
  - not JSON, no type, a non-text status, a multiplier of 4 and missing coordinates are each dropped with their reason and no events, and the next dart comes in;
  - extra fields are accepted;
  - the resync case above.
  - The load test passes within its budget.
