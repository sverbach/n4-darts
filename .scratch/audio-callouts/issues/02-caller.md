# The caller: which calls, and playing them

Status: done
Type: task
Blocked by: 01

## What to do

- `lib/`: a pure function from the previous and the next match state to the calls: a visit that ended (takeout) → its score key; a bust → `busted`; a checkout → `gameshot`, or `matchshot` when it wins the match (no score call then). Unit-tested on match states.
- A player in the browser: preloads the active pack's files once sound is on, plays the calls in order, picks a random variant when a key has several (`key+1`), and skips a call that's late (e.g. more than 3 s after the event).

## Acceptance

- Unit tests for each call and for no call (a dart, a correction, an undo).

## Comments

2026-11-02: Confirmed by the user.

2026-11-02: Built. `lib/callouts.ts`: `callsFor(prev, next)`. When a visit closes it calls the score; a bust or checkout is called on the dart that causes it, like a caller does, and isn't repeated at takeout. When a dart and its takeout reach the page in the same change, the outcome is still called. "Game shot" turns into "game shot and the match" when the checkout wins the match. Corrections, undos, the match starting, and a dart that leaves the visit open make no call. A dart that lands after a bust or checkout (and counts for nothing) doesn't repeat the call. `lib/callPlayer.ts`: Web Audio, one context unlocked by a tap. `load(pack)` fetches and decodes every file, `play(keys)` queues calls, picks a random variant, skips missing keys or files that failed to load, and drops a call that would start more than 3 s after it was queued. `stop()` closes the context. A pack maps each key to its file URLs, and `defaultPack` points at `/callouts/default/`. A test checks it matches the shipped files.
