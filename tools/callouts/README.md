# Caller voice pack

`generate.sh` makes the default pack in `packages/web/public/callouts/default/`: one MP3 per call, named by darts-caller's keys (`0`–`180`, `gameshot`, `matchshot`, `busted`).

```sh
tools/callouts/generate.sh [northern_english_male | ljspeech] [out-dir]
```

It needs `python3`, `curl` and `ffmpeg`. The first run sets up Piper in `tools/callouts/.work/` and downloads the voice (about 110 MB, checked against its SHA-256); later runs reuse them. The words for each key are in `voice.py`.

The voice and licence notes are in the pack's `LICENSE.md`.

The default is Piper's `en_GB-northern_english_male-medium`, a Northern English man. Its base model was trained on research-only recordings, so `LICENSE.md` limits it to running n4 on your own server. `ljspeech` makes a US female voice trained only on public-domain recordings, if you need a voice free of that restriction.

## German pack from Fish Audio

`fish` makes a German pack from a [Fish Audio](https://fish.audio) voice model, one API request per call, and writes it to `tools/callouts/.work/fish/fish-de.zip` for Admin → Sound. It leaves the default pack alone.

```sh
export FISH_API_KEY=...                        # from fish.audio → API keys
FISH_KEYS="0 26 100 137 180 gameshot busted" tools/callouts/generate.sh fish   # test listen first
tools/callouts/generate.sh fish                # then the rest
```

`FISH_VOICE` overrides the voice model (default `fbb19c617d814cc897adb459290462bb`) and `FISH_MODEL` the TTS model (default `s1`). The words are in `fish.py`, with numbers spelled out ("Hundertsiebenunddreißig") and the English terms German callers use for the special calls ("No Score!", "Game Shot!"). Raw clips are kept in `.work/fish/raw/`, and a call is fetched again only when its words, voice or model change, so reruns and fixes cost nothing. To redo one clip that sounds wrong, delete its `.txt` there and run again. It needs `python3` and `ffmpeg`. Check the voice model's terms on Fish Audio before you share the pack.

## Packs from darts-caller

darts-caller's downloads (listed in its [`assets/caller_profiles.py`](https://github.com/lbormann/darts-caller/blob/master/assets/caller_profiles.py)) can't be uploaded as they are: each is a zip holding a zip of numbered recordings plus a CSV template that names them, often over 100 MB. `import.sh` turns one into a pack for Admin → Sound:

```sh
tools/callouts/import.sh <pack-url-or-zip> [out.zip]
tools/callouts/import.sh https://darts-downloads.peschi.org/soundfiles/amazon/en-GB-Brian-Male.zip
```

It names the recordings the way darts-caller installs them (row *n* of the template is the *n*-th recording by name, repeated keys become `key+1`, `key+2`…), keeps only the calls n4 uses, re-encodes them as mono MP3 and writes `tools/callouts/.work/import/<name>.zip` (a few MB). It needs `python3`, `curl` and `ffmpeg`. Those packs are made with commercial text-to-speech services and carry no licence, so keep them on your own server.
