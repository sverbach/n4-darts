# Create a tournament in /admin

Status: ready-for-agent
Type: task
Blocked by: 01, 02, 03

- New "Tournament" tab in `/admin`. With no active tournament: the create page on one screen: name (default today's date), players (picker), format (groups, advancing per group, single/double elimination, bracket reset), legs per phase (groups / winners / losers / final), start score and in/out.
- Live preview: seed list by rating (unseeded below, random order drawn once and stored), ↑/↓ to override; resulting groups; duration estimate.
- Duration estimate: leg length per start score (301 → 4 min, 501 → 6, 701 → 8) until there are 5 recorded legs at that start score, then their real average from event timestamps (`match_events.at` — expose it); per match about 75% of max legs × leg length + 1 min; summed, divided by the number of stations; double elimination counted with the reset.
- Save = draft (survives reload). Players and format editable until the first match is played (fixtures regenerated). "Start tournament" sets it running; only one running tournament.
- Admin API for all of this, behind the PIN.

## Acceptance

- Tests: draft create/update/start; only one running; editing regenerates fixtures; seed override and the stored unseeded order; duration estimate with and without history.
