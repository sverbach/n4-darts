# Home and stats pages

Status: done
Type: task
Blocked by: 01

- **Home** as M-/D-Home:
  - The logo, then a "Stations" list where each tile has a number, the name and a chevron, plus a "Watch" button.
  - A "More" list (Players and stats, Display, Admin).
  - The footer.
- **`/players`** as M-/D-Players:
  - A back link, the title and an explainer line.
  - The leaderboard table: top 3 ranks in violet, avatar and name.
- **`/players/:id`** as M-/D-Player-Profile:
  - The hero: a large avatar, "Rank #n", the name, and "n matches · since <month year>".
  - Stat groups whose rows have a label, a sub-label and a value.
  - The chart restyled.
  - Tournaments, with a pixel trophy for wins.
  - Last matches, with a W/L tag, the score, "vs" opponents, the date and the average.
- **Server.** The profile gets `rank` and `since`.

## Acceptance

- Compared with the mockups at 390 px and 1440 px.
- The server addition is tested.

## Comments

**2026-10-21, done.**
- **Home.** The logo, then "Stations" tiles (number, name, pixel arrow, plus a Watch button) and "More" tiles, with a footer.
- **`/players`.**
  - A back bar with the logo, a title and an explainer.
  - The leaderboard in a panel: top 3 ranks in violet, avatar and name, the rating large and violet. "Swipe table for more" shows on phones.
- **`/players/:id`.**
  - The hero: the avatar in a violet frame with a corner block, "Rank #n", the name, and "n matches · since Mon YYYY".
  - Four stat groups of cards (label, sub-label, value; violet for the headline ones). On a phone they're two-column cards; on a wide screen the cards stack in columns with the number on the right.
  - The chart restyled: square dots, the last evening highlighted and labelled. It's drawn at phone or page width so the text keeps its size.
  - Tournaments with a pixel trophy for wins; last matches with a WON/LOST tag.
- **Server.** The profile gets `rank` (leaderboard position), `since` (first counted day), and `bestPlacing.tournament` (shown under "Best placing"). Tested in `stats.test.ts`.
- **Dates.** Shown as "21 Oct 2026", independent of the browser's locale.
- `styles/pages.css` holds home and the stats pages.
- Checked at 390 px and 1440 px with the seeded data.
