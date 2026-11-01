---
target: run 3 after ui-slop-2 01-06
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/sver/Projects/n4-darts/packages/web/src"
timestamp: 2026-11-01T10-10-03Z
slug: packages-web-src
---
# Critique run 3 (after ui-slop-2 01-06): packages/web/src

Score 27/40 (Acceptable). Method: dual-agent. Detector: 3 advisory findings, all false positives (champion bracket em sizing, heatmap SVG units, sprite logo flagged as marquee). Browser: no off-scale spacing, no overflow; /players Rating and Avg identical under 10 matches (Avg is grey there).

| # | Heuristic | Score |
|---|---|---|
| 1 | Visibility of status | 3 |
| 2 | Match real world | 3 |
| 3 | User control | 3 |
| 4 | Consistency | 2 |
| 5 | Error prevention | 3 |
| 6 | Recognition | 3 |
| 7 | Flexibility | 2 |
| 8 | Minimalist | 3 |
| 9 | Error recovery | 3 |
| 10 | Help | 2 |

## Priority issues
1. [P1] Scroll-edge shading visible where nothing scrolls (cover narrower than the edge since ui-slop-2 04). FIXED in the same session.
2. [P1] Admin tournament page repeats facts: station line names twice ("EVE VS FAY: EVE 101 · FAY 101"); knockout matches in Stations, bracket and Queue; Players list repeats the group table; Matches (6) repeats the queue.
3. [P2] Champion screen has no peak: grey card like the awards, small muted "CHAMPION"; game shot celebrates harder than the champion.
4. [P2] Same thing, different words/fonts: station state "FREE"/"Free"/badge; highest checkout "HC"/"HIGH OUT"/"HIGHEST"; admin station-line names in Geist uppercase.
5. [P2] Kiosk admin layout leaves dead halves: running tournament right column, bracket half width, a lone full-width award card, profile Last matches at half width.

## Minor
"UP: BOB" in the Next player CTA about 11px (unreadable at 2 m); /display avatar initials tiny; empty "TOTAL" before the first dart; "KNOCKOUT" header subtitle above a "KNOCKOUT" section label; profile "since Nov 2026" wraps alone; single-point chart chrome; two "more" controls on admin player rows (avatar badge and ⋮); red used for "Board offline" though PRODUCT.md names only ok/warn for status; HOLD vs SEND BACK vs PAUSE unexplained; Play now live on "Waiting for players" matches.
