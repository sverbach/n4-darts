# The match page: head-to-head, score race, heatmaps

Status: ready-for-agent

`/matches/:id` only showed the dart log, with every visit row starting with the name cut to 70 px ("SCHWE…" for schwembo and schwendi alike), so you couldn't tell who was who. It also didn't say who played better or how the match went.

## Decisions (2026-11-07)

Shaped with the impeccable skill and confirmed by the user.

- **Who and when:** players on their phones (390 px first), after a match or later, from a profile or a tournament page. A page for reading: clarity first.
- **Order on the page:**
  1. **Header:** the names in full, wrapping, never cut. One line of result and rules. The legs score big when legs > 1.
  2. **Head-to-head:** a column per player (avatar and full name), a row per number: 3-dart avg, first 9, checkout % (double-out matches), high out, best leg (darts), 180s, 140+, 100+, darts thrown. The better value in a row is bright and the rest muted: no good/bad colours. With 3–8 players it scrolls sideways, with the labels pinned.
  3. **Score race:** a line per player, the remaining score after each visit, from the start score to the checkout. A bust is a flat step. Built on the chart pieces, with the tap/hover tooltip ("Visit 7 · schwembo · 105 scored · 96 left"), and a leg picker when there are several legs.
  4. **Where the darts landed:** a density heatmap per player, side by side (two per row on a phone), one shared legend. Under about 9 darts a player gets "Too few darts".
  5. **Dart log:** 2 players: a scoresheet, a row per round with both visits side by side and the names once on top. 3+ players: each visit row gets the player's colour mark and the full name on its own line.
- **Player identity:** a categorical **series palette** of 8 colours by throwing order, slot 1 the accent violet. It's checked with the dataviz validator against the dark surface, and used for chart lines, heatmap labels and the log's marks, always next to the name.
- **Data:** the match page's API sends each player's match stats (the engine's `matchStats`, as the profiles use) and their dart positions (as the profile heatmap uses: board-detected, not corrected, not bounce-outs). Only X01 matches have a page, as before.
- **Unchanged:** the URL, the back link, no page for abandoned matches or walkovers, the darts shown as recorded after corrections.

## Out of scope

- Comparing players across matches (head-to-head over time).
- Editing or correcting darts here (that's `/admin`).

## Tickets

1. `01-match-data-and-series-colours.md`: the API's per-player stats and dart positions, the validated series palette
2. `02-header-and-head-to-head.md`
3. `03-score-race.md`
4. `04-heatmaps-per-player.md`
5. `05-dart-log.md`
6. `06-docs.md`
