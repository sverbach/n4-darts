# A WLED client and a fake WLED

Status: needs-triage
Type: task

## What to do

- Server: a small WLED client: `info(url)`, `presets(url)` (id and name), `setPreset(url, id)`, each with a short timeout (e.g. 2 s) and a clear error.
- `tools/wled-sim` (like board-sim): a fake device answering `/json/info`, `/presets.json`, `POST /json/state`, with a page showing the active preset, and an offline switch.

## Acceptance

- Client tests against the fake: info, presets, set, timeout and offline.
