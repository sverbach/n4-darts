# Audio callouts

Status: done

A caller's voice for the match: the visit score, game shot and bust, played by the station kiosk and by a phone on /watch that's connected to the room's speakers.

## Decisions (with the user, 2026-11-02)

- **Calls:** the visit score after each visit ("sixty", "one hundred and eighty"), "game shot" on a checkout ("game shot and the match" when it wins the match), "no score" on a bust.
- **Where:** on the station kiosk and on /watch/n. A speaker switch per device, off by default and remembered by the device; browsers need one tap after each page load before they play audio. If both have sound on, both play.
- **Voice:** our own default pack ships with the app; a pack in darts-caller's format can be uploaded in admin and replaces it.
- **darts-caller packs** (`lbormann/darts-caller`, now `Peschi90/darts-caller`): mostly TTS-made, hosted on `darts-downloads.peschi.org`, with no licence stated in the repositories or packs. So none is bundled; the organiser downloads one and uploads it, for use in their own room. We adopt its format: a folder of `.mp3`/`.wav` named by key (`0`–`180`, `gameshot`, `matchshot`, `busted`, variants as `key+1.mp3`).
- **Our default pack:** generated offline with Piper TTS from a voice whose training data allows redistribution (e.g. one trained on LJSpeech, public domain); the generator script, its inputs and the licence notes live in the repo.
- Everything bundled or stored locally: the room needs no internet (ADR 0005).

## Tickets

1. `01-default-pack.md`: generate and ship our default pack in darts-caller's format
2. `02-caller.md`: which calls a match change makes, and playing them from a pack
3. `03-sound-switch.md`: the speaker switch on the station and on /watch
4. `04-pack-upload.md`: Admin: upload a darts-caller pack, choose the active pack
5. `05-callouts-docs.md`: README, ui-pages, architecture
