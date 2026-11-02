# The speaker switch on the station and /watch

Status: needs-triage
Type: task
Blocked by: 02

## What to do

- Station: "Sound on" / "Sound off" in the board menu. /watch: a speaker button in the header. Off by default; the device remembers the choice.
- With sound remembered on, a page load shows a small "Tap to turn sound on" prompt (browsers allow audio only after a tap); one tap and the calls play.
- /watch keeps the screen awake while sound is on (Wake Lock), so a phone at the speakers doesn't stop.

## Acceptance

- Browser test: switch on, play a visit with the simulator, the page requests the score's file; switch off, nothing requested. `docs/ui-pages.md` updated.
