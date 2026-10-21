# Home and stats pages

Status: ready-for-agent
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
