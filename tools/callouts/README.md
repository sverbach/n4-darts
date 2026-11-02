# Caller voice pack

`generate.sh` makes the default pack in `packages/web/public/callouts/default/`: one MP3 per call, named by darts-caller's keys (`0`–`180`, `gameshot`, `matchshot`, `busted`).

```sh
tools/callouts/generate.sh [out-dir]
```

It needs `python3`, `curl` and `ffmpeg`. The first run sets up Piper in `tools/callouts/.work/` and downloads the voice (about 110 MB, checked against its SHA-256); later runs reuse them. The words for each key are in `voice.py`.

The voice and licence notes are in the pack's `LICENSE.md`.

## A British voice to upload

```sh
tools/callouts/generate.sh northern_english_male [out.zip]
```

This makes `tools/callouts/.work/Northern English male.zip` with Piper's `en_GB-northern_english_male-medium` voice, ready for Admin → Sound. Its recordings are CC BY-SA 4.0 ([OpenSLR 83](https://www.openslr.org/83/)), but the model was fine-tuned from Piper's `lessac` voice, whose recordings are under a research-only licence. So the pack is for your own server and is never committed or shipped as the default.
