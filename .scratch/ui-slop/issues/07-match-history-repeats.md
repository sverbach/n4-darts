# Match history and detail say each fact once

Status: done
Type: task

`/admin` → Matches (`admin-matches-*`, `admin-match-detail-*`):

- Detail: the page heading "MATCHES" plus subtitle sits right above a "← MATCHES" back link; the subtitle says "Ann won" and the leg header "ANN WON" again.
- History list: the Players column names the winner, and Result says "Bob won" again; every row of one evening carries the same "07 NOV 2026, 19:30".
- The hint "Tap a dart to correct it." is styled as a violet match label (`features/admin/matches/MatchHistory.tsx:117`; colour fixed in 14).

## What to do

- Detail: the back link is the heading's place (no page heading above it), or the heading goes; the winner is said once (subtitle), legs show their score.
- History: Result shows the score ("2–1"), the winner marked in the Players column (e.g. bold, or "✓" with a label); rows grouped by evening with the date as a group heading and only the time per row.

## Acceptance

- No fact twice on either screen; `docs/ui-pages.md` (admin matches) updated.
- See `../spec.md` "For every ticket".

## Comments

2026-10-31: Confirmed by the user.

2026-10-31: Built. The matches tab heads itself, so a match's detail replaces the whole page and its heading (only the back link remains). Detail line: "Ann won 1–0 · <rules> · Station 2 · <date>" via `matchRulesLabel`; the hint is a plain hint; a leg's winner shows only when there was more than one leg. History: grouped by evening (date heading, time per row), result as legs, the winner in full colour and the others grey (plus "(won)" for screen readers). History is set off from Stations by a rule (the missing gap).
