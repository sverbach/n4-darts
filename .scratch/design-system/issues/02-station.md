# Station

Status: done
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

## Comments

**2026-10-21, done.**
- **Station page.** The bar has the logo (wide screens only) and the violet station name. The board menu has a "Match" section: End match, with "Goes back in the queue" for tournament matches, or Cancel match on a quick match's lineup. The bottom End match button and the lineup's Cancel are gone.
- **Settings strip.** Shows the label or rules on one side and legs · leg n on the other.
- **New match.** The picker chips have a "n / 8 picked" header; the settings are in a side panel on wide screens; the notice is an amber pill.
- **Lineup.** Numbered rows with pixel up/down buttons.
- **Playing.** Player cards with a "Throwing" tag; three to eight players get compact rows on a phone and columns on wide screens. The visit shows dart tiles (D1–D3 or "Ignored"; the dart that busted is red), the total or "Bust", and the "Remove darts" line. "Next player" shows who's up: the next leg's starter after a checkout.
- **Correction.** A full-screen dialog with "Ann · Dart 2", the current value marked, and 25/Bull/Miss as their own buttons.
- **Game shot.** The framed avatar, then the legs with names.
- **Shared styles.** `styles/components.css` holds the player picker, settings fields, segment picker, board menu and `.wide-only`/`.narrow-only`. `styles/station.css` holds the station, including the scoreboard and game shot that `/watch` reuses.
- **Board status.** Offline is now red, stopped amber, a running command accent.
- **Avatar.** The size now comes from `--avatar` on any parent.
- Every state was checked against the simulator at 390 px and 1440 px: new match, lineup with the menu open, throwing, remove darts, menu while playing, correction, 4 players with a bust, game shot.
