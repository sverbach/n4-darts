# Each match's state in one place on the knockout screens

Status: needs-triage
Type: task

On `/display` in the knockout (`display-knockout-*`) Ann vs Dee is station 1's "Next", the bracket's "On a station" and implied by Up next; Cid vs Bob is in Up next and in the bracket as "Queued". The bracket says "On a station" without naming it while the station card says "Next". Admin's knockout repeats the pairs across Stations, Queue and the bracket.

## What to do

- Decide the owner per fact on /display in the knockout: the bracket carries each match's state with the real station ("Station 1", not "On a station"; `components/MatchCard.tsx:9`), and Up next goes in the knockout phase (it stays in the group phase, where there's no bracket). Or the reverse, if the bracket alone reads worse on the projector: check both at 1080p before choosing, and note the choice here.
- The status words agree everywhere: a match waiting on a station that hasn't started is "Next on Station 1" in every place that shows it.
- Admin: the bracket's status line names the station too; Stations and Queue stay (the organiser acts on them).

## Acceptance

- On `display-knockout-*` every match appears once with its state; the station is named.
- Server view gives the station for an on-station bracket match if it doesn't yet (with a test).
