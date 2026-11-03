# Players can be hidden from the public site

Status: done
Type: task

## What to do

- Players get `public` (default true; a migration sets it for everyone existing). Admin → Players: "Hide from public site" in the row's ⋮ menu, and a marker on hidden rows.
- Every public answer redacts hidden players: name "Player", no photo, no id that leads to a profile; their own profile answers 404 publicly. On the LAN nothing changes.

## Acceptance

- Tests for the leaderboard, a profile, a tournament and a match with a hidden player: redacted publicly, unchanged on the LAN.

## Comments

2026-11-03: Built. Players have `public` (schema version 5; existing players get 1). Admin → Players: "Hide from public site" / "Show on public site" in the ⋮ menu, a small neutral "Not public" pill beside the name (under it on phones). The public app reads through `withHiddenPlayers` (`players/hidden.ts`): a hidden player's name is "Player" and their photo is gone, wherever a view looks a player up. Its `onSend` hook swaps each hidden id for a stand-in (`hidden-1`, …) in every JSON answer, and any `:id` route for a hidden player answers 404. The web app shows a stand-in on a neutral avatar and doesn't link it. Tests: leaderboard, profile, photo and another player's profile publicly, the LAN unchanged (`publicApp.test.ts`); the switch (`players.test.ts`); the browser menu (`admin.spec.ts`). The tournament and match answers get their tests with 04 and 05, which add those routes.
