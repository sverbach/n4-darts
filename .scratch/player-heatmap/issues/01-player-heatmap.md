# Heatmap on the player profile

Status: ready-for-agent
Type: task

The player profile shows where that player's darts actually land, as a heatmap over a drawn dartboard, from the last 500 darts.

## Decisions

- **Data.** Board-detected `DartThrown` events already store `coords` (normalised: bull ≈ (0,0), double ring ≈ radius 0.95, `y` toward 20; see `docs/board-manager-api.md`). The heatmap uses the player's last 500 darts with coordinates, across all matches.
  - **Left out:** bounce-outs (coords (0,0) aren't a position), darts added by hand (no coords), and darts in deleted or cancelled matches.
  - **Corrected darts:** left out too. A correction means the board got the dart wrong, so its coordinates can't be trusted either.
  - **Misses off the board** (radius > 1) are kept and drawn outside the board, up to a cut-off radius.
- **Server.** `GET /api/players/:id/stats` (`PlayerProfile`) gets a `heatmap: { x, y }[]` field with at most 500 points, newest first. That's about 10 KB of JSON. It's computed from the event log like the other profile stats, and no new table is needed.
- **Drawing.** An SVG dartboard (segments, rings, numbers) with a density layer on top: each dart is a soft blurred dot, so clusters glow. On a `<canvas>` behind the SVG if 500 SVG circles turn out to be slow. The colours come from the design system, in light and dark.
- **Where.** A "Where the darts land" section on the profile, below the scoring stats. Full width on phones, next to the average chart on desktop. With fewer than about 30 darts it says "Not enough darts yet" instead.
- **Caption.** "Last 500 darts", or the real number when there are fewer.

## Out of scope

- Filtering by evening, match or tournament.
- A heatmap per target, e.g. only darts aimed at D16 (we don't know what was aimed at).
- Heatmaps on `/watch` or `/display`.

## Acceptance

- Server tests: the 500 limit and order, and that bounce-outs, manual darts and corrected darts are left out.
- Checked in the browser at 390 px and 1440 px with simulator data, in light and dark. A test throw at T20, at S3 and off the board each lands where it should on the drawn board.

## Comments

2026-10-24: Proposal confirmed by the user as written.
