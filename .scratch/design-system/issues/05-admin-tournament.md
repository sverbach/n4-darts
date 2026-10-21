# Admin: shell and tournament

Status: done
Type: task
Blocked by: 01

- **Admin shell** as M-/D-Admin-*:
  - The bar with the logo, "Admin", the section tabs and Log out.
  - The PIN screen with the "Wrong PIN" alert.
  - Page titles with an explainer line.
- **Create.** The name, the "Who's playing?" chips, and on desktop the side panel with the count and "Create draft".
- **Draft.**
  - A "Draft" tag with a "Saved" indicator (shown after each change).
  - Fields grouped as in the mockup.
  - The side panel: seeds by rating with pixel up/down buttons, the groups preview, the problems or estimate, then "Discard" and "Start tournament".
- **Running (groups and knockout).**
  - The header with a "Running" pill, the phase line and progress squares.
  - Station rows, queue rows (label, players, badge, hold, pin and play-now selects), group tables with avatars and collapsible matches, and the bracket.
  - Players with Withdraw and late arrival.
  - "End tournament early".
- **Finished.** The champion block with a trophy, the placings, the awards and "New tournament".

## Acceptance

- Compared with the mockups at 390 px and 1440 px, for each state, against the simulator.

## Comments

**2026-10-21, done.**
- **Admin shell.**
  - The bar has the logo, "Admin", the tabs (underlined in violet; a 4-column row under the bar on phones) and Log out.
  - The PIN screen is a centred panel with a large PIN field and a full-width alert on a wrong PIN. Not checked in a browser: the dev stack runs without a PIN.
  - Every section except Tournament gets a title and an explainer; the tournament heads itself by state.
- **Create.** Name field, the picker with "Who's playing?", and a side panel with the count and "Create draft".
- **Draft.**
  - "Draft" tag with "Saving…" / "Saved".
  - Format, Legs and Game in ruled sections.
  - Side panel: seeds by rating with avatars and pixel up/down buttons, the groups preview, problems (amber) or the estimate (green), then Discard / Start tournament.
- **Running.**
  - The header: "Running" pill, name, phase line and progress squares.
  - Station cards with status pills and actions; queue cards with Ready/Waiting/Held badges and hold/pin/play-now.
  - The roster in two columns with avatars, Withdraw and late arrival.
  - Knockout bracket rows (scrolling sideways), group tables in panels with avatars and collapsible matches.
  - "End tournament early".
- **Finished.** "New tournament" in the header, a champion card with trophy, placings, award cards, then the bracket and groups.
- **Server.** Entrants carry `photo` (tested in `photos.test.ts`).
- **Found along the way.** The player picker capped tournaments at 8 players (the per-match limit). It now takes a `max`, and tournaments have none; the server never had a limit.
- **Seed script.** My dev seed's tournament had an empty config, which made `/api/admin/tournament` fail; the seed now uses the default config. The app was fine.
- Checked by playing a tournament on the simulator: create, draft, running, knockout and finished at 1440 px and 390 px.
