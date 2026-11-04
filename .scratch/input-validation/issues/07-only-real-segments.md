# Only segments a dart can land in

Status: done
Type: task
Blocked by: 01

The engine's `isSegment` (`engine/src/x01.ts`) checks the number (0–20 or 25) and the multiplier (0–3) separately, so it accepts segments no board has:

- **A triple bull** (`{ number: 25, multiplier: 3 }`) scores 75. Under master out it even counts as a finishing dart (`multiplier >= 2`).
- **A miss with a bull's number** (`{ 25, 0 }`) and **a single, double or triple 0** (`{ 0, 1 }` and so on) score 0 but aren't misses as the rest of the code knows them.

They can come in through any route that takes a segment: a correction or an added dart at the station, and a correction in /admin. Found while building 01.

## What to do

- Find out what a miss looks like coming from the Board Manager. The gateway passes on Autodarts' `number` and `multiplier` and casts the multiplier (`board/gateway.ts`), and `docs/board-manager-api.md` or a recording in `prototypes/recordings` should show it. That decides the one valid miss: `{ 0, 0 }`, or whatever the board sends.
- `isSegment` accepts exactly: 1–20 with multiplier 1–3; 25 with multiplier 1 or 2; and the miss.
- If the board ever sends something else for a miss, the gateway turns it into the one miss, so the log only ever holds valid segments.
- Check the web app's dart picker (the correction and add-dart dialogs at the station and in /admin) only offers these.

## Acceptance

- Engine tests: every valid segment passes; `{25,3}`, `{25,0}`, `{0,1}`, `{0,3}`, `{21,1}`, `{-1,1}`, `{1.5,1}` and `{20,4}` are refused.
- A server test over HTTP: adding a triple bull at the station gets `400 "not a valid segment"`.
- Old matches still replay. Nothing in a stored log may be refused on read, so check that the fold doesn't call `isSegment`.
- All checks pass.

## Comments

2026-11-04: Built.
- **What a miss looks like** (`docs/board-manager-api.md`, the 2026-10-18 recording): multiplier 0 with the number of the segment it landed next to (`M17` is `{ 17, 0 }`), or `{ 0, 0 }` for a bounce-out. So there isn't a single miss: any number 0–20 with multiplier 0 is valid. The gateway doesn't need to normalise anything, and the number stays as the board said.
- `isSegment` now accepts exactly: multiplier 0 with a number 0–20; 25 with multiplier 1 or 2; 1–20 with multiplier 1–3. The `Segment` doc comment says what a miss is.
- The web app's `SegmentPicker` only offers 1–20 × S/D/T, 25, the bull and the miss `{ 0, 0 }`, so nothing changes there.
- Old matches: `isSegment` is only called on requests (`SegmentInput` in `api.ts`). The fold never calls it, so stored logs replay as before.
- Tests: in `x01.test.ts`, every valid segment, and the refusals: treble bull, a miss next to the bull, single and treble 0, 21, a negative number, a number that isn't whole, a quadruple, text, nothing. In `station.test.ts`, adding a treble bull at the station gets `400 "not a valid segment"`.
