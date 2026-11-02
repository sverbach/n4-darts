# The speaker switch on the station and /watch

Status: done
Type: task
Blocked by: 02

## What to do

- Station: "Sound on" / "Sound off" in the board menu. /watch: a speaker button in the header. Off by default; the device remembers the choice.
- With sound remembered on, a page load shows a small "Tap to turn sound on" prompt (browsers allow audio only after a tap); one tap and the calls play.
- /watch keeps the screen awake while sound is on (Wake Lock), so a phone at the speakers doesn't stop.

## Acceptance

- Browser test: switch on, play a visit with the simulator, the page requests the score's file; switch off, nothing requested. `docs/ui-pages.md` updated.

## Comments

2026-11-02: Confirmed by the user.

2026-11-02: Built. `useCallouts(match, { wakeLock })`: the preference sits in `localStorage` (`n4.sound`), wrapped so the page works when storage is blocked. While it's on but not yet unlocked, any click or key press on the page resumes the audio context. The pack loads once sound is active. Calls come from comparing each match update with the last one of the same match. The station's board menu gets a "Sound" section: "Turn sound on" / "Turn sound off", worded like the menu's other actions. /watch gets a pixel speaker button at the right end of the header, `aria-pressed` while on, at least 36 px so a phone can tap it; the header grows to fit on small screens. The prompt is a violet "Tap to turn sound on" pill, a button, in the same place on both pages. Wake Lock is requested on /watch while sound is on, and again when the page becomes visible. Browser test (`callouts.spec.ts`): an init script tags fetched buffers with their URL and records which ones start playing. With sound on, the station plays `85.mp3` after a visit; with it off, nothing. /watch remembers the setting through a reload, shows the prompt, a tap clears it, and a checkout plays `matchshot.mp3`. The /watch visual snapshots were updated for the speaker button.
