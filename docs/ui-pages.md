# n4-darts: UI pages

A summary of every page and what it does, as a brief for the design system pass. Today the styling is a plain dark theme.

## Context

n4-darts runs darts evenings: a few automatic dartboards (stations) play x01, which means each player counts down from 301, 501 or 701 to exactly zero. It can run a tournament on those boards.

| Page | Who uses it | Device | Input |
|---|---|---|---|
| `/station/n` | The players at that board | Laptop or tablet beside the board, full-screen kiosk mode | Touch, read from about 2–3 m away |
| `/watch/n` | Spectators | Projector or TV | None |
| `/display` | Everyone in the room | Projector, 16:9, read from across the room | None |
| `/players`, `/players/:id` | Players | Their phones, sometimes a laptop | Touch |
| `/admin/...` | The organiser | Mostly a phone, sometimes a laptop | Touch |
| `/` | Anyone | Any | Links only |

**How the pages behave:**
- **Live:** every page except the stats pages and the home page updates by itself, with no refresh.
- **Visual states:** status indicators everywhere use only "ok" (green) and "warn" (amber/red).
- **Errors:** an error shows as a red line near the top of the page.
- **Confirmations:** destructive actions ask first, with the browser's confirm dialog.

**Shared building blocks:**
- **Avatar:** a round player photo. A player without a photo gets their initials on a colour derived from them. It comes in two sizes, small (inline with names) and large (scoreboard, champion, profile).
- **Board status plus menu:** a status pill reading "Board online", "Board stopped", "Board offline" or "Server offline", with a ⋮ button beside it. The button opens a small menu: Stop/Start detection, Calibrate, Reset board. While an action runs, the pill shows its progress or result for a few seconds ("Calibrating…", "Calibrated", "Board reset", or an error).
- **Player picker:**
  - A wrap of name chips, each with an avatar, plus an "add new player" input and button below.
  - Tapping chips picks players in order, and each picked chip shows its order number. Tapping a picked chip again removes it.
  - At most 8 players can be picked.
- **Match settings:** four dropdowns.
  - Start: 301, 501 or 701.
  - In rule: Single, Double, Master or Bull.
  - Out rule: Single, Double or Master.
  - Legs: "Best of 3/5/…" for two players, "First to n legs" for more.
- **Segment picker:** a full-screen overlay for correcting a dart.
  - A title such as "Correct T20" and a Cancel button.
  - A Single/Double/Triple segmented control.
  - A grid of 1–20, plus 25/Bull and Miss buttons.
- **Group table:** columns #, Player, P, W, L, (Legs), +/−, Pts, Avg.
- **Bracket match card:** a label (e.g. "WB R1 M2"), two player rows with the winner highlighted and legs won, and a status line when there's no result yet ("Queued", "On a station", "Playing", "Walkover").
- **Awards list:**
  - Rows of title, value and player name(s).
  - The titles: Best match average, Highest checkout, Most 180s, Best leg ("n darts").

---

## `/`: Home

A title and a list of links:
- Each station, with a small "Watch" link beside it.
- "Players and stats".
- "Display (projector)".
- "Admin".

---

## `/station/n`: Station

This is the main screen for players: a kiosk at the board. The darts are detected automatically. The screen shows the score and lets players fix mistakes.

**Top bar (always):** the station name on the left, the board status plus menu (described under shared building blocks) on the right.

The page body has four states.

### 1. No match: "New match" (quick match)
- An optional notice line, e.g. "Match abandoned" or "Waiting for the tournament".
- The hint "Pick 2–8 players. You can change the order next."
- The player picker (players can add themselves here).
- The match settings.
- A primary "Continue" button, enabled once at least 2 players are picked.

### 2. Lineup (a match is set up, not started)
This screen comes after a quick match, or when the tournament puts a match on this station.
- **Header:**
  - The match label, e.g. "Group A" or "WB Semi-final", if it's a tournament match.
  - A title, "Ann vs Bob" or "Next match".
  - The hint "501, best of 3. Top of the list throws first."
- **Order list:** a numbered list (position, avatar, name) with ↑/↓ buttons to reorder.
- **Buttons:** "Shuffle" and a primary "Start". "Cancel match" is in the ⋮ menu, only for non-tournament matches.

### 3. Playing
This is the central screen.
- **Scoreboard:**
  - One column per player, laid out side by side for 2 players and more compact for 3–8.
  - Each column shows a large avatar, the name, a huge remaining score, and a meta line: "Legs 1", "Not in" (a double-in rule isn't met yet), "Last 60" or "Last Bust".
  - The current player's column is highlighted.
- **Current visit** (up to 3 darts per turn):
  - Three dart slots (e.g. "T20", "S5", "D16"), with empty slots when fewer darts have landed.
  - The visit total, or "Bust".
  - Below it, either "Remove darts" (prominent; the board waits for the darts to be pulled out) or "Ann to throw".
  - The hint "Tap a dart to correct it". A tapped dart opens the segment picker.
  - The visit area has a bust style, and an ignored dart is greyed out (a dart thrown after a bust or checkout).
- **Buttons:** "Undo" and a primary "Next player" (to skip ahead when the board misses the takeout).
- **End match:** in the ⋮ menu, under "Match", with a confirmation. For a tournament match it notes "Goes back in the queue".

### 4. Match won
- "Game shot", "Ann wins", and the legs result ("3 – 1") when legs > 1.
- Buttons: "Undo" and a primary "Done", which closes the match and returns to New match.

---

## `/watch/n`: Watch one station

The same scoreboard as the station, for a projector or TV, with nothing clickable.
- **Top bar:** the station name, the match label when there is one, and "Server offline" if disconnected.
- **States:**
  - "Connecting…".
  - A free station shows "Free" or the station notice.
  - "Next: Ann vs Bob" (not started).
  - The scoreboard plus the current visit.
  - Game shot / winner.

It needs to fit a 720p screen without scrolling.

---

## `/display`: Projector

A room-wide overview for 16:9. Everything scales to fit, with no scrolling. "Server offline" shows in a corner when disconnected. The page has three modes.

### Idle (no running tournament)
- The header "n4-darts".
- **Station cards** (left side): see the live station card below. Each card links to `/watch/n`.
- **Leaderboard** (right side, if any matches have been played): #, Player (avatar), Rating, Matches, 180s, High out.
- With no matches played at all, only the station cards show, full width.

### Running tournament
- **Header:** the tournament name and "Group phase · 12 of 30 matches played" (or "Knockout").
- **Left column:**
  - "Now playing": the live station cards.
  - "Up next": the next queued matches, each with a label and "avatar Ann vs avatar Bob".
- **Right/main area:**
  - Group phase: the group tables, one per group (the group heading is shown only when there are several groups).
  - Knockout: the bracket. The winners bracket and final are on top, the losers bracket below. Columns are rounds, each holding bracket match cards.

### Finished tournament
- A header with the name and "Finished" or "Ended early".
- **Champion block:** a "Champion" label, a large avatar and the name.
- **Final placings:** a list of the place ("1", "3–4" for shared places) and the name.
- **Awards list.**

**Live station card** (used in Idle and Running): a station name, a match label if any, then one of:
- "Free", "Paused" or "Board offline".
- "Next: Ann vs Bob".
- A live score: a row per player (avatar, name, legs, remaining score, or "Won"), with the thrower highlighted, and below it the current visit's 3 darts and the total.

The layout must cope with 1–3+ stations and 2–8 players per match.

---

## `/players`: Leaderboard (stats)

- A back link "← n4-darts" and the title "Players".
- A table of everyone who has played a counted match, sorted by rating:
  - Columns: #, Player (avatar plus name, linking to the profile), Rating (3-dart average over the last 10 matches), Avg (all time), M (matches), W (wins), 180s, HC (highest checkout).
  - The table scrolls horizontally on a phone.
- Empty or loading: "No matches played yet." / "Loading…".

## `/players/:id`: Player profile

- A back link "← Players", then a large avatar and the name.
- **Four stat groups** (cards of label and value):
  - **Average:** Rating (last 10), 3-dart average, First 9 (the average over the first three visits of each leg).
  - **Checkouts:** Checkout % ("38% of 21"), Highest checkout, Best leg ("15 darts").
  - **Scoring:** 180, 140+, 100+ counts.
  - **Results:** Matches won ("12 of 20 (60%)"), Legs won, Tournaments won ("1 of 4"), Best placing.
- **"Average per evening":** a small line chart (an SVG) with dates on the x axis, the average on the y axis, and a tooltip on each dot.
- **"Tournaments":** a list of the name, date and placing, with 🏆 for a win.
- **"Last matches":** a list of "Won 2–1 vs Bob", the date and the match average.
- A player with no matches shows the name and "No matches played yet."

---

## `/admin`: Admin

Organiser pages, used mostly on a phone.

**PIN login** (if a PIN is set): the title "Admin", a numeric PIN field and an "Unlock" button, with "Wrong PIN" on error.

**Layout once unlocked:**
- A top bar with "Admin" and a "Log out" button (only shown if a PIN is set).
- Tab navigation: **Tournament · Players · Stations · Matches**.
- Each section has an h1 title and a one-line description.

### `/admin/tournament` (the default tab)

There's one tournament at a time, and the tab shows one of three states.

**1. Create**
- A name field (the default is today's date).
- "Who's playing?" with the player picker.
- A "Create draft" button.

**2. Draft editor** (all changes save immediately)
- **Name:** an input.
- **Players (n):** the player picker.
- **Format:**
  - Groups: 1–4.
  - Advance per group: Everyone, or Top 1–4.
  - Knockout: Double or Single elimination.
  - Grand final: With bracket reset, or One match (double elimination only).
- **Legs:** best-of dropdowns for Group matches, Winners bracket (or Knockout), Losers bracket and Final.
- **Game:** Start, In, Out.
- **Seeds:** an ordered list of position, name and rating, with ↑/↓ buttons.
- **Groups preview:** "Group A: Ann, Bob, …" (when there are several groups).
- **Problems:** a list of blocking problems (e.g. not enough players). Without problems it shows the estimate "Takes about 2 h 30."
- **Buttons:** "Discard" (danger) and a primary "Start tournament".

**3. Running / finished**
- **Header:** the name and "Group phase · 12 of 30 matches played · ends around 22:40".
- **When finished:**
  - Final placings, with the champion highlighted.
  - The awards list.
  - A "New tournament" button.
- **Stations** (while running): a row per station with:
  - The name and a status ("Board online", "Board offline" or "Paused").
  - The current match, e.g. "Group A Ann vs Bob: 301 / 140".
  - Buttons: Pause/Resume. For a match that hasn't started yet, also "Send back" and "Hold".
- **Queue (n)** (while running): a row per waiting match with:
  - The label and a status badge ("Ready", "Waiting for players" or "Held", plus "only Station 2" when pinned).
  - The players.
  - Actions: Hold/Release, a "Pin to station" dropdown (Any station or Only X), and a "Play now on…" dropdown.
- **Knockout:** the bracket, as rows of round columns with match cards. It scrolls horizontally.
- **Groups:** for each group, the table plus a collapsible "Matches" list of fixtures with results ("3:1", "(w/o)" for walkovers, or a status).
- **Players** (while running): the entrants, with a "Withdraw" button for each (or "Withdrawn"). During the group phase there's also a "Late arrival…" dropdown with an "Add" button.
- **"End tournament early"** (danger).

### `/admin/players`
- An "Add new player" input and button.
- **Player list:** each row shows:
  - The avatar (tap it to edit the photo).
  - The name and rating.
  - Buttons: Rename (switches the row to an inline form with Save/Cancel), Archive/Restore, Delete (danger).
  - On a narrow phone, the buttons wrap below the name.
- **"Archived (n)":** a collapsible list of archived players.
- **Photo editor** (an overlay dialog):
  - The player's name and Close.
  - Choose a file, or take a photo on a phone.
  - A round crop area where you drag to move and pinch, scroll or use the zoom slider to zoom. The hint reads "Drag to move, pinch or use the slider to zoom."
  - Buttons: "Choose another" and a primary "Save". "Remove photo" (danger) appears if the player has a photo.

### `/admin/stations`
- **Station list:** a row per station with:
  - "1. Station name" (a link to `/station/1`) and the board status plus menu.
  - The board address (e.g. `http://192.168.1.139:3180`).
  - Buttons: Edit (switches to an inline form) and Remove (danger, disabled while the station has a match).
- **"Add a station":** a form with a Name (optional) field, a Board address field and an "Add station" button, plus a hint about what the board address is.

### `/admin/matches`
- **Stations:** a row per station with:
  - The name (a link), the status pill and the current match summary: "Ann 141 (1) · Bob 60 (0)", "Ann, Bob: waiting to start" or "Ann won". The station shows "Free" when idle.
  - Buttons: "Details" (opens the match detail) and "End match" or "Cancel match" (danger).
- **History:** a list of finished matches. Each row shows the players, the result ("Ann won 2–1", "Abandoned" or "No winner (corrected)") and the date and time. Tapping a row opens the match detail.
- **Match detail** (replaces the list; live):
  - A back button "← Matches".
  - The title "Ann vs Bob" and the line "501, best of 3 · station 1 · Ann won 2–1 · 20 Oct 2026, 21:14".
  - The hint "Tap a dart to correct it."
  - Per leg, the heading "Leg 1 · Ann starts · Ann won" and a list of visits. Each visit shows the player name, the dart buttons and the visit score, with "Bust" or ✓ for a checkout.
  - A corrected dart shows its original struck through. Tapping a dart opens the segment picker.
