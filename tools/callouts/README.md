# Caller voice pack

`generate.sh` makes the default pack in `packages/web/public/callouts/default/`: one MP3 per call, named by darts-caller's keys (`0`–`180`, `gameshot`, `matchshot`, `busted`).

```sh
tools/callouts/generate.sh [northern_english_male | ljspeech] [out-dir]
```

It needs `python3`, `curl` and `ffmpeg`. The first run sets up Piper in `tools/callouts/.work/` and downloads the voice (about 110 MB, checked against its SHA-256); later runs reuse them. The words for each key are in `voice.py`.

The voice and licence notes are in the pack's `LICENSE.md`.

The default is Piper's `en_GB-northern_english_male-medium`, a Northern English man. Its base model was trained on research-only recordings, so `LICENSE.md` limits it to running n4 on your own server. `ljspeech` makes a US female voice trained only on public-domain recordings, if you need a voice free of that restriction.
