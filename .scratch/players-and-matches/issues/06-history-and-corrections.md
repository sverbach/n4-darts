# Match history and organiser corrections

Status: done
Type: task
Blocked by: 05

- `/admin` history: finished and abandoned matches, newest first, with players, winner (or "abandoned") and legs score.
- Match detail: every leg and visit with its darts, including corrections (original detection still visible, ADR-0002).
- The organiser can correct any dart in any visit of a running or finished match (appends `DartCorrected` with `source: "admin"`). If a correction changes a finished match's winner, the stored result follows.
- Abandoned matches never count as results (stats come later, but nothing here may treat them as won/lost).

## Acceptance

- Tests: correction in an earlier leg of a finished match flips the winner and the stored result; corrections on a running match update the station live.

## Comments

**2026-10-18, done.** `GET /api/admin/matches` (closed matches, newest first: players, winner, abandoned, legs won), `GET /api/admin/matches/:id` (adds the full `MatchState` and `originals`: the board's first detection for every corrected dart), `POST /api/admin/matches/:id/corrections` (`{ dartId, segment }`, appends `DartCorrected` with `source: "admin"`). A running match is corrected through its station (`Station.correct`), so the station's state and live viewers update; a closed match gets the event appended directly and its stored winner recomputed from the log. An abandoned match never gets a winner, whatever is corrected. Web: History on `/admin/matches`; detail view with every leg and visit, tap any dart to correct it, corrected darts show the original struck through; running matches open from "Details" on their station row and refresh every 3 s.
- A correction can leave a closed match without a winner (shown as "No winner (corrected)"); correcting it back restores the result. Fine for now; worth revisiting with tournaments, where a result feeds the bracket.
