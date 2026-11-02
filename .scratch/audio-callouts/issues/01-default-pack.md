# Our default voice pack

Status: needs-triage
Type: task

## What to do

- `tools/callouts/`: a script that generates the default pack with Piper (offline) and ffmpeg: `0`–`180`, `gameshot`, `matchshot`, `busted`, as mono MP3 at a small bitrate, named by darts-caller's keys.
- Choose a voice whose model card and training data permit redistribution; record the voice, its licence and the generator's version next to the pack.
- The pack ships with the web app (`packages/web/public/callouts/default/`), loaded only when sound is switched on.

## Acceptance

- The pack is under about 2 MB; every key exists; a licence note sits beside it.
