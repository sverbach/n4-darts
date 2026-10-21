# Station

Status: ready-for-agent
Type: task
Blocked by: 01

`/station/n` as in the mockups (M-/D-Station-*).

- **Bar.** The logo (desktop only), the station name in violet, the board status pill and the ⋮ menu.
- **Menu.** It gets a "Match" section: "End match" (for a tournament match with the note "Goes back in the queue"), or "Cancel match" on the lineup of a non-tournament match. The confirmations stay. The bottom End match and lineup Cancel buttons go away.
- **Settings strip** under the bar while a match is set up or running.
- **New match.** Player chips with a picked-order badge, a "n / 8 picked" count, the settings panel (beside the chips on desktop, below them on mobile), a slanted "Continue", and the notice as an amber pill.
- **Lineup.** The label, "Ann vs Bob", the rows with position, avatar, name and pixel up/down buttons, then "Shuffle" and "Start".
- **Playing.**
  - Player cards: the active one has a violet border and a "Throwing" tag. Each card shows the avatar, the name, a huge remaining score and "Legs n · Last n" (with "Not in" in amber).
  - The visit panel: three dart tiles (D1–D3, or "Ignored"), the total or "Bust", the "Remove darts" status line, and "Tap a dart to correct it".
  - "Next player" with "Up: X", and "Undo".
  - Desktop puts the buttons to the right of the visit.
- **Multi-player.** The 4-player layout from the mockup.
- **Correction.** The segment picker as a full-screen dialog with the context line ("Station 1 · Ann · Dart 2"), the Single/Double/Triple segmented control, the number grid with the current value marked, and 25/Bull/Miss.
- **Won.** "Game shot", the avatar with corner brackets, "Ann wins", the legs result with names, "Undo" and "Done".

## Acceptance

- Each state is compared with its mockup at 390 px and 1440 px against the simulator: menu open, bust, 4 players, correction.
