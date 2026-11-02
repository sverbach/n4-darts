# Our default voice pack

Status: done
Type: task

## What to do

- `tools/callouts/`: a script that generates the default pack with Piper (offline) and ffmpeg: `0`–`180`, `gameshot`, `matchshot`, `busted`, as mono MP3 at a small bitrate, named by darts-caller's keys.
- Choose a voice whose model card and training data permit redistribution; record the voice, its licence and the generator's version next to the pack.
- The pack ships with the web app (`packages/web/public/callouts/default/`), loaded only when sound is switched on.

## Acceptance

- The pack is under about 2 MB; every key exists; a licence note sits beside it.

## Comments

2026-11-02: Confirmed by the user.

2026-11-02: Built. `tools/callouts/generate.sh` sets up piper-tts 1.8.0 in a venv under `tools/callouts/.work/` (ignored), downloads `en_US-ljspeech-high` (checked by SHA-256), speaks the lines from `voice.py`, then ffmpeg trims silence, normalises loudness and writes mono 32 kbit/s MP3s. The result is 184 files, 1.1 MB. The voice was trained from scratch on LJ Speech (public domain) and the voices repo is MIT. Piper itself is GPL and isn't shipped. The 0 and the bust both say "No score."; 180 is spoken with an exclamation. The macOS wheel's espeak looks for its data in the wrong place unless the directory also contains an `espeak-ng-data` folder, so the script copies the data dir and links it into itself.
