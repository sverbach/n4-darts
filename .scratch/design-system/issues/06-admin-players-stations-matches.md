# Admin: players, stations, matches

Status: done
Type: task
Blocked by: 05

- **Players** as M-/D-Admin-Players:
  - The add form.
  - Rows with an avatar button (a camera badge), the name and rating, and Rename, Archive, Delete.
  - The inline rename.
  - The collapsible archived list.
- **Photo editor** as M-/D-Admin-Photo:
  - The header with Close.
  - An octagon crop frame.
  - A zoom slider with − and +.
  - Remove photo, Choose another, Save.
- **Stations** as M-/D-Admin-Stations: rows with the name link, the board address, the status pill with menu (including "Calibrating…"), Edit and Remove; the inline edit form; and the "Add a station" panel.
- **Matches** as M-/D-Admin-Matches: station rows with summary, Details and End/Cancel, and the history table.
- **Match detail** as M-/D-Admin-Match-Detail:
  - A back link, the "Live" badge while running, and the summary line.
  - Legs as sections with visit rows and dart buttons (corrected darts show the original struck through).
  - All legs except the last collapsed.

## Acceptance

- Compared with the mockups at 390 px and 1440 px against the simulator.

## Comments

**2026-10-21, done.**
- **Players.**
  - The add form; rows with an avatar button carrying a violet "…" badge, the name with "Rating n", and Rename/Archive/Delete (wrapping below on phones).
  - Inline rename with a violet field.
  - A collapsible archived panel.
- **Photo editor.**
  - A violet-framed panel over a dimmed page with "Photo / Ann" and Close.
  - The crop area is cut to the avatar octagon, with a dashed outline.
  - Zoom slider with − and +; Remove photo / Choose another / Save.
- **Stations.** Cards with the name link, the board address, the status pill with ⋮ menu, and Edit / Remove (disabled while the station has a match). The inline edit form gets a violet frame. "Add a station" is a side panel.
- **Matches.**
  - A card per station (status, summary, Details / End match).
  - The history as a table on wide screens and two-line rows on phones.
- **Match detail.** Back link, "Live" while unfinished, then the title and summary line. Legs are collapsible sections with only the last open. Darts are tiles; corrected ones are framed in violet with the original struck through. The segment picker marks the current value.
- **Legacy CSS.** `styles/legacy.css` is gone; everything lives in the design-system sheets.
- **Docs.** `docs/architecture.md` now has a "Design system" decision section, and build step 6 is done.
- Checked against the simulator at 1440 px and 390 px: rename open, photo crop with an uploaded image, station edit, matches with a live match, match detail.
