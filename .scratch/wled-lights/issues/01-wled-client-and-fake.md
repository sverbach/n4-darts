# A WLED client and a fake WLED

Status: done
Type: task

## What to do

- Server: a small WLED client: `info(url)`, `presets(url)` (id and name), `setPreset(url, id)`, each with a short timeout (e.g. 2 s) and a clear error.
- `tools/wled-sim` (like board-sim): a fake device answering `/json/info`, `/presets.json`, `POST /json/state`, with a page showing the active preset, and an offline switch.

## Acceptance

- Client tests against the fake: info, presets, set, timeout and offline.

## Comments

2026-11-03: Built. `packages/server/src/lights/wled.ts`: `info(url)` (name, version), `presets(url)` (id and name, without WLED's empty slot 0), `setPreset(url, id)` (`POST /json/state` with `{"ps": id}`); a 2 s timeout by default, and `WledError` with "didn't answer within 2 s", "can't be reached", "answered 400" or "isn't a WLED device". `tools/wled-sim` (`@n4/wled-sim`): `/json/info`, `/json/state`, `/presets.json` (eight presets named after the events by default), `POST /json/state`; a page at `/` with the preset that's on, the last ones and an offline switch; `setOnline`, `setDelay` for tests; `pnpm --filter @n4/wled-sim sim` on :3190. Added to vitest and the Dockerfile's install step. Tests: the client against the fake (info, presets, set, timeout, offline, unknown preset), the fake itself.
