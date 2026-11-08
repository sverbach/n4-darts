# n4-darts: UI pages

A summary of every page and what it does, as a brief for the design system pass. Today the styling is a plain dark theme.

## Context

n4-darts runs darts evenings: a few automatic dartboards (stations) play x01, which means each player counts down from 301, 501 or 701 to exactly zero. It can run a tournament on those boards.

| Page | Who uses it | Device | Input |
|---|---|---|---|
| `/station/n` | The players at that board | Laptop or tablet beside the board, full-screen kiosk mode | Touch, read from about 2–3 m away |
| `/watch/n` | Spectators | Projector or TV (big screens only); a phone at the room's speakers for sound | The speaker button only |
| `/display` | Everyone in the room | Projector, 16:9, read from across the room | None |
| `/players`, `/players/:id`, `/tournaments`, `/tournaments/:id`, `/matches/:id` | Players | Their phones, sometimes a laptop | Touch |
| `/admin/...` | The organiser | Mostly a phone, sometimes a laptop | Touch |
| `/` | Anyone | Any | Links only |

**How the pages behave:**
- **Live:** every page except the stats pages and the home page updates by itself, with no refresh.
- **Visual states:** status indicators are "ok" (green), "warn" (amber: needs a look) and "danger" (red: broken, e.g. board or server offline), always as a pill.
- **Errors:** an error shows as a red line near the top of the page.
- **Confirmations:** destructive actions ask first, with the browser's confirm dialog.

**Shared building blocks:**
- **Top bar:** on the station, the stats pages, /watch and /display, the logo first on the left and the theme star last on the right, with the page's own content between (on the station the board menu, and on /watch the sound button, come after the star). Admin has its own header with the section tabs.
- **Theme star:** two little pixel sparkles in the text colour (violet on hover or focus), like the favicon, at the right end of the top bar (in admin beside the logo, on home at the top right). A tap moves this device to the next theme (Unit violet, Terminal cyan, Phosphor green, Synth magenta, Caution yellow, Mecha orange, Daylight) and flashes its name for 1.5 s. The choice is remembered per device. Home's sparkle logo does the same when tapped.
- **Avatar:** a round player photo. A player without a photo gets their initials on a colour derived from them. It comes in two sizes, small (inline with names) and large (scoreboard, champion, profile).
- **Board status plus menu:** a status pill reading "Board online", "Board stopped", "Board offline" or "Server offline", with a ⋮ button beside it. On the station page, while the board is taking out (it waits to see the board empty) the pill reads "Takeout…"; after 10 seconds it turns amber, "Takeout stuck", with a "Reset board" button beside it. The button opens a small menu: Stop/Start detection, Calibrate, Reset board, and on the station page "Turn sound on/off" (see Sound). While an action runs, the pill shows its progress or result for a few seconds ("Calibrating…", "Calibrated", "Board reset", or an error).
- **Sound (station and /watch):** a caller's voice calls the visit's score on its third dart (again with the new score if a dart is corrected, or at takeout for a visit ended early), "No score" on a bust, "Game shot" on a checkout and "Game shot, and the match" when it wins the match. It's off by default, switched per device (the station's board menu, the speaker button on /watch) and remembered by that device. Browsers allow sound only after a tap, so a page that loads with sound on shows a violet "Tap to turn sound on" pill; any tap on the page turns it on. If several devices have sound on, they all play. With sound on, /watch keeps the screen awake.
- **Player picker:**
  - A wrap of name chips, each with an avatar, plus an "add new player" input and button below.
  - Tapping chips picks players in order, and each picked chip shows its order number (not in the tournament draft, where the seeds set the order). Tapping a picked chip again removes it.
  - At most 8 players can be picked.
- **Match settings:** four dropdowns.
  - Start: 301, 501 or 701.
  - In rule: Single, Double, Master or Bull.
  - Out rule: Single, Double or Master.
  - Legs: "Best of 3/5/…" for two players, "First to n legs" for more.
- **Segment picker:** a full-screen overlay for correcting a dart, or adding one the board missed.
  - A title such as "Correct T20" or "Add dart 3", and a Cancel button.
  - A Single/Double/Triple segmented control.
  - A grid of 1–20, plus 25/Bull and Miss buttons.
- **Group table:** columns #, Player, P, W, L, (Legs), +/−, Pts, Avg.
- **Bracket match card:** under its round's heading, only what the heading doesn't say ("2" under "Semi-final", nothing for the final), two player rows with legs won (the winner bold, the loser grey once decided), a violet frame while it's on a station, and "Walkover" when it was one. Where a match is (queued, on a station, playing) is said by the station cards, not the bracket.
- **Awards list** (a tie of more than two shows "4 players", not the names):
  - Rows of title, value and player name(s).
  - The titles: Best match average, High out, Most 180s, Best leg ("n darts").

---

## `/`: Home

The animated logo, then two lists of links:
- **Stations** (live): each station's name on one line, and under it what it's doing ("Ann vs Bob · 61 – 101", "Ann vs Bob · waiting to start", "Ann won", or its notice). When the board needs a look, a small "Board stopped" or "Board offline" pill takes that line's place. A free station has a small "Free" pill on the right. A "Watch" link sits beside each station in the same frame.
- **More:** "Players and stats", "Projector", "Admin".

---

## `/station/n`: Station

This is the main screen for players: a kiosk at the board. The darts are detected automatically. The screen shows the score and lets players fix mistakes.

**Top bar (always):** the station name on the left, the board status plus menu (described under shared building blocks) on the right, with the "Tap to turn sound on" pill before them when needed.

**Settings strip (while a match is set up or running, not at game shot):** the match label (tournament matches), then every rule in one line, the same on every screen: "501 · Double out · First to 3 legs", plus "Leg 2" when legs > 1. In a party mode: the mode and how far it is, e.g. "High Score · Round 3 of 7", "Golf · Hole 2 of 18", "Cricket · Sudden death at the bull".

The page body has four states.

### 1. No match: "New match" (quick match)
- An optional notice line, e.g. "Match abandoned" or "Waiting for the tournament".
- The hint "You can change the order next." (the picker counts the picks).
- The player picker (players can add themselves here).
- The match settings: first **Game** (X01, Around the Clock, Golf, High Score, Killer, Cricket, Random Checkout, Bermuda), then only that game's options. X01: start, in rule, out rule, legs. Around the Clock: skip-ahead on or off. Golf: course random (the default) or in order, 9 or 18 holes. High Score: 1–20 rounds. Killer: 1–9 lives. Cricket: standard or cut-throat points. Random Checkout: difficulty ("Beginner: 2–40, single out" (the default), "Medium: 41–100", "Hard: 101–170", "Mixed: 2–170") and 1–20 rounds (default 10). Bermuda: order classic (the default) or shuffled. The X01 options are kept while another game is picked.
- A primary "Continue" button, enabled once at least 2 players are picked.

### 2. Lineup (a match is set up, not started)
This screen comes after a quick match, or when the tournament puts a match on this station.
- **Header:**
  - The match label, e.g. "Group A" or "WB Semi-final", if it's a tournament match.
  - The title "Throwing order".
  - The hint "Top of the list throws first." (the rules are in the settings strip).
- **Order list:** a numbered list (position, avatar, name) with ↑/↓ buttons to reorder.
- **Buttons:** "Shuffle" and a primary "Start". "Cancel match" is in the ⋮ menu, only for non-tournament matches.

### 3. Playing
This is the central screen.
- **Scoreboard:**
  - One column per player, laid out side by side for 2 players and more compact for 3–8.
  - Each column shows a large avatar, the name, a huge remaining score, and a meta line: "Legs 1", "Not in" (a double-in rule isn't met yet), "Last 60" or "Last Bust".
  - The current player's column is framed and their score is violet: the only sign of whose turn it is.
  - Desktop only: while the current player can finish this visit, a checkout route under their score, e.g. "T20 · T10 · D20", with the next field brighter. It follows the out rule and updates after each dart.
- **Current visit** (up to 3 darts per turn):
  - Three dart slots labelled "Dart 1" to "Dart 3" (values e.g. "T20", "S5", "D16"), with empty slots when fewer darts have landed.
  - The visit total, or "Bust".
  - Below it, one line: "Taking out…" while the board takes out, "Remove darts" (prominent; the board waits for the darts to be pulled out), "Ann to throw" before the visit's first dart, or the hint "Tap a dart to correct it" once a dart is down. A tapped dart opens the segment picker.
  - While the player is throwing, the next empty slot shows "+ Add": for a dart the board missed. It opens the segment picker ("Add dart 3") and the dart counts as if the board had seen it.
  - The visit area has a bust style, and an ignored dart is greyed out (a dart thrown after a bust or checkout).
- **Buttons:** "Undo" and "Next player" with "Up: Bob", both secondary buttons. Next player is the fallback when the board misses the takeout, so it stays on screen through every visit and never moves into the ⋮ menu.
- **End match:** in the ⋮ menu, under "Match", with a confirmation. For a tournament match it notes "Goes back in the queue".

**Party modes** use the same screen, with these differences:
- **High Score** keeps the player cards: the total, "Last 45", and in sudden death "Sudden death" or "Out".
- **Modes with a target** (Around the Clock, Golf, Killer, Cricket, Random Checkout, Bermuda) lead with the **target board**: a drawn dartboard with the thrower's targets lit in violet. On a kiosk it takes the left of the screen, sized to fit; on a phone it sits on top. Beside it (below it on a phone) is the mode's panel:
  - Around the Clock and Killer: a compact player list, the thrower framed. Around the Clock shows each player's target ("7", "Bull"); Killer shows their number big, with "Charge 1/3 · 3 lives", "Killer · 2 lives" or "Out" (dimmed). The board lights the target (Around the Clock), the thrower's own number while charging, or the opponents' double rings once they're a killer.
  - Golf: a scorecard, holes across and players down, with the total pinned on the right; the current hole in violet, a hole in one in green. On a phone it scrolls sideways. The board lights the hole's number.
  - Cricket: the marks grid, targets 20–15 and Bull down and players across, marks drawn /, X and ⊗ (green once closed), points at the bottom, numbers closed by everyone dimmed. The board lights every number still open, only the bull in sudden death.
  - Random Checkout: a "Check out" panel above the player list, with the number big in violet (what's left of it after the first dart, "Check out · from 32"; ✓ once finished, red on a bust) and the checkout hint beside it, the next dart brighter. The players show their points and "✓ Checked out" or "✗ Missed" for this round. The board lights the hint's next dart.
  - Bermuda: a panel above the player list with "Round 2 of 13", the round's target big ("13", "Any double", "Outer bull") and the 13 targets in a row (done dimmed, current in violet, to come). The players show their score and this round's "+26" or "Halved". The board lights the target: the number, every double ring, every treble ring, or the bull.
  - In sudden death, the settings strip says so ("Random Checkout · Beginner · Sudden death", "Bermuda · Sudden death at the bull"), as does Bermuda's panel, and the players no longer in it show "Out" (dimmed).
- **The visit total** is named for the mode: "Total" (High Score, Random Checkout, Bermuda), "Hits" (Around the Clock, Killer: darts that did something), "Best" (Golf: the best dart so far), "Marks" (Cricket).
- **No checkout route and no bust,** except in Random Checkout, where the hint is in its panel and a bust shows as in X01.

### 4. Match won
- "Game shot", the winner's avatar in violet brackets and "Ann wins".
- The legs result, winner's first ("3 – 1"), when legs > 1 (with more than two players: "3 legs").
- How it was won: the checkout ("40", "Checkout · D20") and the winner's match 3-dart average.
- In a party mode only the winner, plus their total (High Score, Golf, Bermuda) or points (Cricket, Random Checkout).
- The settings strip is hidden: the result takes its place.
- Buttons: "Undo" and a primary "Done", which closes the match and returns to New match.

---

## `/watch/n`: Watch one station

The same scoreboard as the station, for a projector or TV. Big screens only: there is no phone layout. The only control is the speaker button, for a phone or laptop at the room's speakers.
- **Top bar:** the station name, the match label when there is one, the rules line while the match runs, "Server offline" if disconnected, and at the right end the speaker button (pressed while sound is on), or the "Tap to turn sound on" pill.
- **States:**
  - "Connecting…".
  - A free station shows "Free" or the station notice.
  - "Next: Ann vs Bob" (not started).
  - The scoreboard plus the current visit (turn shown by the framed card and violet score only).
  - Game shot, as on the station but larger: winner, "ANN 1 – 0 BOB" (the opponent and the legs), checkout and average.
- **Party modes:** as on the station, with the target board big on the left and the mode's panel on the right. Golf's scorecard shows the nine holes being played (front or back) plus the total, so 18 holes fit. Random Checkout's and Bermuda's panel sits above the board, so the player list keeps the whole right column.

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
- **Header:** the tournament name and the phase ("Group phase" or "Knockout"), with a progress square per match and the count beside them ("6 / 9").
- **Left column:**
  - "Now playing": the live station cards.
  - "Up next" (group phase only; in the knockout the bracket shows what's left): the next queued matches in the scheduler's order, "avatar Ann vs avatar Bob". In the group phase there's no "Group match n" label (the fixture number isn't the playing order); with several groups the group shows; knockout matches keep their label ("Semi-final 2").
- **Right/main area:**
  - Group phase: the group tables, one per group (the group heading is shown only when there are several groups).
  - Knockout: the bracket. The winners bracket and final are on top, the losers bracket below. Columns are rounds, each holding bracket match cards.

### Finished tournament
- A header with the name and "Finished" or "Ended early".
- **Champion block:** the evening's peak, wider than the other columns: "CHAMPION" in violet at headline size, a large avatar in the violet brackets and the name in big capitals.
- **Final placings:** from second place on (the champion has the block), the place ("2", "3–4" for shared places) and the name.
- **Awards list.**

**Live station card** (used in Idle and Running): a station name, a match label if any, then one of:
- "Free", "Paused" or "Board offline".
- "Next: Ann vs Bob".
- A live score: a row per player (avatar, name, legs, remaining score, or "Won"), with the thrower highlighted, and below it the current visit's 3 darts and the total. In a party mode the score is the mode's: the target (Around the Clock), the total (High Score, Golf, Bermuda), the lives (Killer) or the points (Cricket, Random Checkout), and the visit's total is named as on the station.

The layout must cope with 1–3+ stations and 2–8 players per match.

---

## `/players`: Leaderboard (stats)

- The logo, then a back link "← Home" (the theme star at the top right), the title "Players" and a link "Tournaments ▶" beside it.
- A table of everyone who has played a counted match, sorted by rating:
  - Columns: #, Player (avatar plus name, linking to the profile; a player hidden from the public site shows there as "Player" on a grey avatar, without a link), Rating (3-dart average over the last 10 matches), Avg (all time), M (matches), W (wins), 180s, High out (highest checkout).
  - On a phone only #, Player, Rating, M and High out show; the rest from the kiosk width.
- Empty or loading: "No matches played yet." / "Loading…".

## `/players/:id`: Player profile

- A back link "← Players", then a large avatar, the name and one line below it: "Rank #3 · 20 matches · since Jul 2026".
- **Four stat groups** (cards of label and value, each value once; a sub-label only where the label alone doesn't say it; no accent colour):
  - **Average:** Rating ("Last 10 matches"), 3-dart avg ("All time", only from 11 matches on: before that it equals the rating, which then reads "All matches"), First 9 (the average over the first three visits of each leg).
  - **Checkouts:** Checkout % ("Of 21 darts"), High out, Best leg ("Darts").
  - **Scoring:** 180s, 140+, 100+.
  - **Results:** Matches won ("60%"), Legs won ("Of 41"), Tournaments won ("Of 4"). The best placing is in the tournaments list.
  - On a phone a group's cards share a row; on desktop they stack in four columns that end level.
- **"Average per day":** a line chart with a dot per day played, on a time axis (gaps between days show), the average on the y axis, the dates in capitals and thinned so they never overlap, and the last day's value tagged. Hovering anywhere (a mouse) or tapping (a phone) shows a dashed line and a tooltip for the nearest day: "12 Nov 2026 · 48.3 avg · 3 matches". A session past midnight counts to the day it started. With a single day it's just the number and the date.
- **"Where the darts land":** a heatmap over a dimmed dartboard: the density of the player's last 500 board-detected darts from X01 matches, in seven bands of the heat ramp (dark red where few landed, pale yellow where most did). Below it a stepped legend, "Fewer → More", and the caption "Last 500 darts" (or the real number). With fewer than 30 darts it says "Not enough darts yet". Next to the average chart on desktop, the two cards the same height; below it on phones.
- **"Tournaments":** a list of the name, date and placing, with 🏆 for a win; each links to the tournament's page.
- **"Last matches":** a list of "Won" / "Lost" (in words: full colour and grey, not green and red), "2–1 vs Bob", the date and the match average; each links to the match's page.
- A player with no matches shows the name and "No matches played yet."

## `/tournaments`: Past tournaments

- A back link "← Players" and the title "Tournaments".
- A list of finished tournaments, newest first: the name and date, then 🏆 with the champion's avatar and name, or "Ended early". Each links to its page.
- Empty or loading: "No finished tournaments yet." / "Loading…".

## `/tournaments/:id`: A past tournament

- A back link "← Tournaments", the name and the date (plus "Ended early").
- **"Final placings"** (the champion in brackets, then everyone by place) and **"Awards"**, side by side on desktop, as admin shows a finished tournament.
- **"Knockout":** the bracket, a round per column on desktop, stacked on a phone. A played match links to its page.
- **"Groups":** each group's table and its collapsible "Results (n)", each result linking to its match's page.

## `/matches/:id`: A finished match

A page for reading on a phone, after a match or later. Each player has one mark throughout: a small square in their series colour (by throwing order) next to their full name. Names are never cut off; they wrap.
- A back link "← Players", the players as the title ("Ann vs Bob"), one line "Ann won · 501 · Double out · First to 2 legs · 07 Nov 2026", and the legs score large ("2–1") when there was more than one leg.
- **Head-to-head:** a column per player, a row per number: 3-dart avg, first 9, checkout % (double out only), high out, best leg, 180s, 140+, 100+, darts. The best value of each row is bright and the others muted (no colours for good or bad). Three players fit on a phone; four or more scroll sideways with the labels pinned.
- **Score race:** a line per player, their remaining score after each visit of a leg, from the start score to 0. A bust is a flat step with a hollow square. The names sit at the lines' ends, with a legend below. Hover or tap shows the round: every player's score and what's left. With several legs, "Leg 1 · Leg 2 · …" buttons pick one (the last first). On a kiosk it sits beside the head-to-head, the same height.
- **Where the darts landed:** each player's density heatmap (as on the profile) with their name and dart count, two per row on a phone, and one "Fewer → More" legend. A player under 9 darts gets "Too few darts"; if nobody has 9, the section is left out.
- **Every dart:** each leg collapsed but the last ("Leg 2 · Bob starts · Bob won"). With two players it's a scoresheet: a row per round with both players' darts and totals side by side ("Bust" in red, "Out" on the checkout), the names once on top. With more players, each visit row shows the player's name on its own line, then the darts and the score. A dart thrown after the visit was over is crossed out. No corrections here (that's admin's match detail).
- Abandoned matches, walkovers and unknown ids: "No such match".

---

## `/admin`: Admin

Organiser pages, used mostly on a phone.

**PIN login** (if a PIN is set): the title "Admin", a numeric PIN field and an "Unlock" button, with "Wrong PIN" on error.

**Layout once unlocked:**
- A top bar with "Admin" and a "Log out" button (only shown if a PIN is set).
- Tab navigation: **Tournament · Players · Stations · Matches · Sound · Lights · Diagnostics**.
- Each section has an h1 title and a one-line description.

### `/admin/tournament` (the default tab)

There's one tournament at a time, and the tab shows one of three states.

**1. Create**
- A name field (the default is today's date).
- "Who's playing?" with the player picker.
- A "Create draft" button.

**2. Draft editor** (all changes save immediately)
- **Header:** "Tournament" with a "Draft" state and "Saving…"/"Saved" beside it, and the line "Every change saves right away…".
- **Name:** an input.
- **Players (n):** the player picker.
- **Format:**
  - Groups: 1–4.
  - Advance per group: Everyone, or Top 1–4.
  - Knockout: Double or Single (elimination).
  - Grand final: With bracket reset, or One match (double elimination only).
  - The hint "Advance per group: how many from each group go on to the knockout, best first."
- **Legs:** best-of dropdowns for Group matches, Winners bracket (or Knockout), Losers bracket and Final.
- **Game:** Start, In, Out.
- **Seeds:** the hint "By rating, the 3-dart average over the last 10 matches; new players last, in a random order. ↑/↓ to change.", then an ordered list of position, name and rating, with ↑/↓ buttons.
- **Groups preview:** "Group A: Ann, Bob, …" (when there are several groups).
- **Problems:** a list of blocking problems (e.g. not enough players). Without problems it shows the estimate as a plain line, "Takes about 2 h 30."
- **Buttons:** "Discard" (danger) and a primary "Start" (named "Start tournament" for screen readers).

**3. Running / finished**
- **Header:** the name with a "Running" / "Finished" pill beside it, the line "Group phase · ends around 22:40" and the progress squares (once finished: "30 of 30 matches played").
- **When finished:**
  - Final placings: a champion card ("Champion" and the name), then the rest from second place.
  - The awards list.
  - A "New tournament" button.
- **Layout while running:** Stations top left and the Queue on the right; under the stations the Groups during the group phase, the Knockout bracket after it (the groups then move to the foot). On a phone: Stations, Queue, then the rest.
- **Stations** (while running): a row per station with:
  - The name, and a status only when it needs the organiser ("Board offline" or "Paused"); a healthy station shows none.
  - The current match, each name once: "Group A · ANN 301 · BOB 140", "ANN VS BOB · waiting to start" or "ANN won".
  - Buttons: Pause/Resume. For a match that hasn't started yet, also "Send back" and "Hold".
- **Queue (n)** (while running): grouped under "Ready (n)", "Waiting for players (n)" and "Held (n)", a card per waiting match with:
  - The label and the players.
  - Actions: Hold/Release, one station dropdown (Any station or Only X) and "Play now", which puts the match on the station it's kept for, or the first free one (disabled when none is free). On a phone the dropdown has its own line.
- **Knockout:** the bracket, as rows of round columns with match cards (scrolling sideways on a wide screen); on a phone the rounds stack, one under the other.
- **Groups:** for each group, the table (on a phone: #, Player, P, W, L, Pts) with a ⋮ menu per row to withdraw the player (a withdrawn one is struck through, "Out"), plus a collapsible "Results (n)" of the played fixtures ("3–1", "(w/o)" for walkovers). During the group phase a "Late arrival…" dropdown with "Add" sits above the tables.
- **"End tournament early"** (danger).

### `/admin/players`
- An "Add new player" input and button.
- **Player list:** each row shows:
  - The avatar (tap it to edit the photo).
  - The name, and the rating under the list's one "Rating" heading.
  - A "Not public" pill beside the name (under it on a phone) for a player hidden from the public site.
  - A ⋮ menu: Change photo, Rename (switches the row to an inline form with Save/Cancel), Hide from public site / Show on public site, Archive/Restore, Delete (danger).
- **"Archived (n)":** a collapsible list of archived players.
- **Photo editor** (an overlay dialog):
  - The player's name and Close.
  - Choose a file, or take a photo on a phone.
  - A round crop area where you drag to move and pinch, scroll or use the zoom slider to zoom. The hint reads "Drag to move, pinch or use the slider to zoom."
  - Buttons: "Choose another" and a primary "Save". "Remove photo" (danger) appears if the player has a photo.

### `/admin/stations`
- **Station list:** a row per station with:
  - The station name (a link to `/station/1`) and the board menu; the status pill shows only when the board isn't online and detecting, or while a menu action runs.
  - The board address (e.g. `http://192.168.1.139:3180`).
  - Buttons: Edit (switches to an inline form) and Remove (danger, disabled while the station has a match).
- **"Add a station":** a form with a Name (optional) field, a Board address field and an "Add station" button, plus a hint about what the board address is.

### `/admin/matches`
- **Stations:** a row per station with:
  - The name (a link), the board status only when it isn't fine, and the current match summary: "Ann 141 (1) · Bob 60 (0)", "Ann, Bob: waiting to start" or "Ann won". The station shows "Free" when idle.
  - Buttons: "Watch" (opens `/watch/n`) while a match runs, and "End match" or "Cancel match" (danger).
- **History** (set off by a rule): finished matches grouped by day, the date once as a heading. Each row shows the players (the winner first and in full colour, the others grey), the result as legs, the winner's first ("2–1", "Abandoned", "Walkover" or "No winner") and the time. A row opens the match's page, `/matches/:id`; abandoned matches and walkovers have none, so their rows aren't links. Darts aren't corrected here: that happens at the station during the match.

### `/admin/lights`
The WLED light strips, and what each station's do.
- **Stations:** a card per station:
  - **Device:** "No lights" or one of the devices.
  - With a device: **Idle** (no match) and **Playing** (a match on) presets, then a row per event: Match start, Leg won, Game shot, 180, 100+ visit, Bust, High out (100+), each with a preset ("None" leaves it out), its seconds (5 when first picked) and **Test** (starts it now; the base comes back after its seconds).
  - Presets are picked from the device's own list ("5 · Game shot"); while the device can't be reached, a line says so and their numbers can be typed.
  - Every choice is saved as it's made. On a phone each event's name sits above its preset, seconds and Test.
- **Devices** (beside the stations on desktop, below on a phone): a card per device with its name, address, a ⋮ menu (Edit, Remove with a confirmation) and **Test connection**: a green pill with the device's name and its number of presets, or the error in red. Below, **Add a device**: name and address.

### `/admin/sound`
The caller's voice, for every device with sound on (switching sound on stays on each device: see Sound under shared building blocks).
- **Voices:** a row per voice: "Default voice" (built in, all 184 calls) first, then each uploaded pack with its name (the zip's) and how much it covers: "All 184 calls", or "12 of 184 calls · the default voice says the rest", plus the number of recordings when a call has variants. The voice in use has a green "In use" tag; the others have "Use". An uploaded pack has "Delete" (danger, confirmed); deleting the one in use goes back to the default voice.
- **"Upload a pack":** a hint on darts-caller's format (files named by call: `60.mp3`, `gameshot.mp3`, `matchshot.mp3`, `busted.mp3`, variants as `gameshot+1.mp3`; anything else is left out), a file picker for the zip, the note "Packs from other projects aren't ours to share: upload only what you may use", and an "Upload pack" button. A zip over 50 MB, a broken zip or one without calls shows an error. Not shown when the server has no data folder.

### `/admin/diagnostics`
Whether the server keeps up, for explaining a slow evening from data. It refreshes every 2 seconds. The timings are only collected while the page has been open in the last 2 minutes, so they start fresh when you open it.
- **Event loop:** how long the server was blocked over the last minute: median, 99th percentile and longest.
- **Darts:** the last 20 darts, each with how long it took from the board's message to the station's screens.
- **Boards:** per station, online or offline, reconnects since the server started, time since the board's last message, and the last reset/start/stop with its round trip.
- **Lights** (once the lights were used): per device, the calls sent since the server started, how many failed (amber when any), and the last failure with its time.
- **Live streams:** every open screen, with its kind (station, watch, display, admin tournament, stations, admin stations, match detail, admin lights, …), client address, how long it has been open, updates sent and browser.
- **Views:** per kind of stream, how often its view was computed in the last minute, and how long that took on average and at most.
- **Database:** writes in the last minute and the slowest one.
- **This page's request:** "Direct" or "Through a proxy", with the `x-forwarded-*`, `via` and `x-real-ip` headers it came with.

Values that worry are shown in amber and red.

---

## Formats

Every screen writes these the same way (`packages/web/src/lib/format.ts`, `lib/labels.ts`):
- **Rules:** "501 · Double in · Double out · First to 3 legs" (a straight in rule is left out).
- **Legs and shared places:** an en dash, "2–1", "3–4".
- **Empty value:** one en dash, "–".
- **Visit totals:** unpadded ("40"); before the first dart of a visit, nothing.
- **Averages:** one decimal.
