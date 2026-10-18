# Create a match in /admin and assign it to a station

Status: ready-for-agent
Type: task
Blocked by: 04

- `/admin` matches page: pick 2–8 active players, settings (start score, in/out rule, legs; "best of N" wording for two players, "first to N" otherwise), and a station.
- Assigning to a station that already has a match (assigned or running) is refused. No queue.
- The station picks it up live and shows the start flow from ticket 04.
- `/admin` shows each station's current match and can abandon it.

## Acceptance

- Test: create and assign via admin API, station view shows it; second assignment to the same station refused; admin abandon closes it.
