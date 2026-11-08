# Board Manager 2.1

Status: ready-for-agent
Type: task
Blocked by: 02, 03

## What to do

- Compare the 2.1 recording with the 2.0.2 one; write the differences into `docs/board-manager-api.md` as a 2.1 section.
- `board/versions/v2_1.ts`: the flat dart and the camelCase events and statuses, mapped to the internal shape.
- A replay test for the 2.1 recording.
- The simulator's `--board-version 2.0|2.1` (default 2.1); its tests run for both.
- Note in the API doc what `failed` and `method` turned out to be, if the recording shows it.

## Acceptance

- Both recordings replay to the same board events for the same throws.
- e2e passes against a 2.1 simulator.
- All checks pass.
