# Create a tournament in /admin

Status: done
Type: task
Blocked by: 01, 02, 03

- New "Tournament" tab in `/admin`. With no active tournament: the create page on one screen: name (default today's date), players (picker), format (groups, advancing per group, single/double elimination, bracket reset), legs per phase (groups / winners / losers / final), start score and in/out.
- Live preview: seed list by rating (unseeded below, random order drawn once and stored), ↑/↓ to override; resulting groups; duration estimate.
- Duration estimate: leg length per start score (301 → 4 min, 501 → 6, 701 → 8) until there are 5 recorded legs at that start score, then their real average from event timestamps (`match_events.at` — expose it); per match about 75% of max legs × leg length + 1 min; summed, divided by the number of stations; double elimination counted with the reset.
- Save = draft (survives reload). Players and format editable until the first match is played (fixtures regenerated). "Start tournament" sets it running; only one running tournament.
- Admin API for all of this, behind the PIN.

## Acceptance

- Tests: draft create/update/start; only one running; editing regenerates fixtures; seed override and the stored unseeded order; duration estimate with and without history.

## Comments

**2026-10-18, done.** `tournaments.ts`: `createTournaments(db, stations)` with `view`, `create`, `update` (name, players, config sections, `seedOrder`), `discard`, `start`; routes `GET|POST|PATCH|DELETE /api/admin/tournament`, `POST /api/admin/tournament/start`. Seeds: by rating, unseeded at the end in a random order drawn once; players who stay keep their place, rated newcomers go in by rating, unseeded ones at a random spot among the unseeded. Groups by snake seeding on every change. `configProblems` (in `tournament/plan.ts`) blocks starting; the view shows them instead of an estimate. `estimate.ts`: leg length from two-player completed matches at the start score (checkout dart time minus leg start, from `timedEvents`; legs over 30 min ignored), defaults until 5 legs; ~75% of max legs per match + 1 min, divided by the stations. `tournament/plan.ts` also has `plan()`, the whole tournament from entrants and results (group fixtures, knockout once groups are done, champion, placings with non-advancers after the knockout by group position), used from ticket 05 on. Web: Tournament tab (now the default `/admin` page): create form, draft editor that saves every change and shows seeds (↑/↓), groups, problems and the estimate; Start / Discard. Editing after the start (before the first match is played) comes with ticket 05, where the fixtures exist.
