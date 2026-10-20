# Docs: display, watch, stats, backups

Status: done
Type: task
Blocked by: 02, 03, 04, 05, 07, 08, 09

- README: the new pages in the "Run it locally" table (`/display`, `/watch/n`, `/players`), setting up the projector, backups and restoring.
- `docs/architecture.md`: decisions from this spec folded into "Decisions so far"; the build order marked done up to step 5.
- `GLOSSARY.md`: Leaderboard, Profile, Awards, First-9 average, Checkout %, as needed.

## Comments

**2026-10-20, done.** README: `/display`, `/watch/1` and `/players` in the "Run it locally" table; under "Running a tournament" the awards, putting `/display` (and a station via `/watch/n`) on the projector, and what counts for stats; backups and restoring were added with ticket 05. `docs/architecture.md`: a "Display and stats" decisions section, live updates are Server-Sent Events (was WebSocket in the plan), backups without a download button, build order steps 1–5 marked done with the design system pass as step 6. `GLOSSARY.md`: a Stats section (3-dart average, first-9 average, checkout %, leaderboard, profile, awards).
