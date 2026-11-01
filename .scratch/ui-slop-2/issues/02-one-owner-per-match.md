# Each match's state in one place on the knockout screens

Status: done
Type: task

On `/display` in the knockout (`display-knockout-*`) Ann vs Dee is station 1's "Next", the bracket's "On a station" and implied by Up next; Cid vs Bob is in Up next and in the bracket as "Queued". The bracket says "On a station" without naming it while the station card says "Next". Admin's knockout repeats the pairs across Stations, Queue and the bracket.

## What to do

- Decide the owner per fact on /display in the knockout: the bracket carries each match's state with the real station ("Station 1", not "On a station"; `components/MatchCard.tsx:9`), and Up next goes in the knockout phase (it stays in the group phase, where there's no bracket). Or the reverse, if the bracket alone reads worse on the projector: check both at 1080p before choosing, and note the choice here.
- The status words agree everywhere: a match waiting on a station that hasn't started is "Next on Station 1" in every place that shows it.
- Admin: the bracket's status line names the station too; Stations and Queue stay (the organiser acts on them).

## Acceptance

- On `display-knockout-*` every match appears once with its state; the station is named.
- Server view gives the station for an on-station bracket match if it doesn't yet (with a test).

## Comments

2026-11-01: Confirmed by the user ("go ahead with the ui-slop-2 tickets").

2026-11-01: Built, with the reverse of the ticket's first option, chosen after comparing at 1080p: the station cards already own "what's on a station" (the waiting match, the live score), so the bracket owns the draw and the results and no longer repeats station state in its own words. The bracket card drops its "Queued" / "On a station" / "Playing" lines (only "Walkover" stays) and keeps its violet frame while live; /display drops Up next in the knockout phase (the bracket shows what's left; Up next stays in the group phase). Admin's bracket follows the same card, and its Stations and Queue sections own where matches are. No server change was needed. Also: the winner row is bold and the loser grey only once a match is decided.
