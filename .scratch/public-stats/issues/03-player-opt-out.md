# Players can be hidden from the public site

Status: needs-triage
Type: task

## What to do

- Players get `public` (default true; a migration sets it for everyone existing). Admin → Players: "Hide from public site" in the row's ⋮ menu, and a marker on hidden rows.
- Every public answer redacts hidden players: name "Player", no photo, no id that leads to a profile; their own profile answers 404 publicly. On the LAN nothing changes.

## Acceptance

- Tests for the leaderboard, a profile, a tournament and a match with a hidden player: redacted publicly, unchanged on the LAN.
