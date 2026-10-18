# Match history and organiser corrections

Status: ready-for-agent
Type: task
Blocked by: 05

- `/admin` history: finished and abandoned matches, newest first, with players, winner (or "abandoned") and legs score.
- Match detail: every leg and visit with its darts, including corrections (original detection still visible, ADR-0002).
- The organiser can correct any dart in any visit of a running or finished match (appends `DartCorrected` with `source: "admin"`). If a correction changes a finished match's winner, the stored result follows.
- Abandoned matches never count as results (stats come later, but nothing here may treat them as won/lost).

## Acceptance

- Tests: correction in an earlier leg of a finished match flips the winner and the stored result; corrections on a running match update the station live.
