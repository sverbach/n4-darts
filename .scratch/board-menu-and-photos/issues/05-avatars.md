# Avatars everywhere

Status: done
Type: task
Blocked by: 03

- A shared `Avatar` component: the photo (lazy, cached by version) or a coloured circle with initials (colour derived from the player id).
- Large: station scoreboard, `/watch`, the champion on `/display`, the profile header. Small: `/display` Now playing and Up next, both leaderboards, admin Players list, the station player picker and lineup.

## Acceptance

- Checked in a browser: with and without photos on the station (phone width), `/watch` and `/display` (1280×720), `/players` and a profile.

## Comments

**2026-10-20, done.** `Avatar` (photo by versioned URL, lazy; or initials on a colour from the player id; sized in `em`, `large` for headers) now shows large on the station scoreboard (and so on `/watch`), the champion on `/display` and the profile header; small on `/display`'s Now playing rows and Up next (which also fixes Up next after it switched from names to players), both leaderboards, the admin Players list, the station's player picker and the lineup. `/watch`'s score shrank a little so "… to throw" still fits at 720p with the avatars.
- Checked in a browser with two of four players having photos: picker, lineup and scoreboard at 390 px; `/watch`, idle and running `/display` at 1280×720; `/players`.
