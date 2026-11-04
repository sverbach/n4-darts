# WLED's answers parsed with Zod

Status: done
Type: task
Blocked by: 06

`lights/wled.ts` casts what a WLED device answers: `/json/info` as `{ name?: unknown; ver?: unknown }`, and `/presets.json` as `Record<string, { n?: unknown }>`. That's untrusted input from the network, just like a request, and the lint rule from 06 only lets it through because it sits inside an `as` cast. Found while building 05.

## What to do

- In `wled.ts`, parse both answers with Zod schemas kept next to the client. They describe WLED's API, not ours, so they don't belong in `api.ts`.
  - **`/json/info`:** a loose object (WLED sends many more fields) with `name` a string and `ver` optional. A device without a name stays `WledError("<url> isn't a WLED device")`, and a missing `ver` stays `""`.
  - **`/presets.json`:** a record of id to entry. An entry counts when its id is a whole number above 0 and it has a string `n`; WLED's empty slot 0 and unnamed playlists are dropped as today. An answer that isn't an object at all is `WledError("<url> isn't a WLED device")`.
- Lint: allow `zod` in `lights/wled.ts`, as an adapter to the outside, alongside the routes. Update ADR 0010's consequences and section 8.8 to say so: adapters at the edge (routes, device clients) parse what comes in.

## Acceptance

- `wled.test.ts`, against a stand-in device that answers what the test says:
  - info without a name, info that isn't an object, and presets that aren't an object are each "isn't a WLED device";
  - a missing `ver` gives `""`;
  - presets with slot 0, unnamed entries, a non-numeric id and non-object entries keep only the named ones, sorted.
- The existing lights tests pass against `tools/wled-sim`.
- No `as` cast is left on WLED's answers.
- All checks pass.

## Comments

2026-11-04: Built.
- `wled.ts` has `InfoAnswer`, a loose object with `name` a string and `ver` optional. A `ver` that isn't text falls back to `""` (`.catch`) rather than being coerced.
- It also has `PresetsAnswer`, a record. Each entry is kept when its key parses as a whole id ≥ 1 (`PresetId`) and its value has a string `n` (`NamedPreset`).
- A failed parse is `WledError("<url> isn't a WLED device")`, which Admin → Lights already shows as the device's test result (502). No `as` cast is left on the answers.
- **Behaviour change:** a `/presets.json` of `null` used to give an empty list (`all ?? {}`). Now it's "isn't a WLED device", since a real WLED always answers an object (at least `{"0":{}}`).
- **Lint:** `zod` is allowed in `lights/wled.ts`; it moved from the logic override to the one with `api.ts` and `parse.ts`, so `fastify` stays banned there. The import rule's message now says "parsed at the edge".
- **Docs:** ADR 0010 (the import list, plus a "same goes for devices" consequence), section 8.8 (a "Devices too" bullet and the linter list) and 5.2 (the linter list).
- Tests in `wled.test.ts` ("what a device answers") use a stand-in HTTP device that answers any JSON:
  - info without a name, info that isn't an object and a non-text name are refused;
  - a missing or numeric `ver` gives `""`;
  - presets as a list, text or `null` are refused;
  - a mix of slot 0, a playlist without a name, a non-numeric id, a non-object entry and a numeric name keeps only the named presets, sorted by id.
