# The caller: which calls, and playing them

Status: needs-triage
Type: task
Blocked by: 01

## What to do

- `lib/`: a pure function from the previous and the next match state to the calls: a visit that ended (takeout) → its score key; a bust → `busted`; a checkout → `gameshot`, or `matchshot` when it wins the match (no score call then). Unit-tested on match states.
- A player in the browser: preloads the active pack's files once sound is on, plays the calls in order, picks a random variant when a key has several (`key+1`), and skips a call that's late (e.g. more than 3 s after the event).

## Acceptance

- Unit tests for each call and for no call (a dart, a correction, an undo).
