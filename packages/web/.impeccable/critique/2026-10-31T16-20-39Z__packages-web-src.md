---
target: "current UI: repeated information and spacing"
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/sver/Projects/n4-darts/packages/web/packages/web/src"
timestamp: 2026-10-31T16-20-39Z
slug: packages-web-src
---
# Critique: packages/web/src (whole UI) — repeated information and spacing

Score 27/40 (Acceptable). Method: dual-agent.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of status | 4 | Board pills, THROWING, Remove darts, live projector |
| 2 | Match real world | 3 | Rules written three ways; zero-padded "040" totals |
| 3 | User control | 3 | Red "Cancel" on correcting screen reads destructive |
| 4 | Consistency | 2 | "-"/"—", "0-0"/"0:0", "Board online"/"Online", padded vs unpadded totals |
| 5 | Error prevention | 3 | Two near-identical station selects per queue card |
| 6 | Recognition | 3 | Labels everywhere, sometimes too many |
| 7 | Flexibility | 2 | No bulk actions; 3 buttons per player row |
| 8 | Minimalist | 2 | Active player signalled 5x; rules and progress repeated |
| 9 | Error recovery | 3 | Correction flow excellent |
| 10 | Help | 2 | Obvious hints repeated; real gaps (Advance per group) unexplained |

## Priority issues
1. [P1] Active player signalled 5x on station/watch (PlayerCards.tsx:96, StationPage.tsx:370, :458, WatchPage.tsx:111/140) — distill
2. [P1] Match settings repeated in three formats (strip, lineup subtitle StationPage.tsx:208-210, watch) — clarify
3. [P1] Spacing/overflow: new-match grid overflows phone gutter (StationPage.tsx:145 1fr_1fr), no gap between Stations and History (MatchesAdmin.tsx:22), "3–4" wraps (TournamentRun.tsx:106), "Single eli" truncation, Diagnostics tab clipped — layout
4. [P2] Accent/status drift: violet headings (DisplayPage.tsx:19), violet hint (MatchHistory.tsx:117), arbitrary accent tiles, green/red for won/lost, slanted S/D/T toggle, red Cancel, --faint sub-labels at 1.8:1 — quieter
5. [P2] Admin redundancy: Board online on 3 tabs, Waiting for players x4, two selects per queue card, RENAME/ARCHIVE/DELETE + RATING per row — distill

## Repeated information (full list)
Station visit 5x turn signals; phone hint stacking; lineup "Ann vs Bob" + rules; new-match subtitle vs 0/8 counter; game shot name twice, no result; watch name 4x; progress text + squares (display and admin); knockout round names twice and Semi-final 2 in Up next + bracket; up-next order 2,4,3,5,6; champion in panel + placings, 4-name ties x3; admin champion label+trophy+badge; draft chip numbers vs seed numbers (and rating 29.2 vs 39.0, verify); "1. Station 1"/"01 Station 1"; match detail Matches heading + back link, "Ann won" twice, winner in Players + Result, date per row; board pill on 3 tabs; Waiting for players x4; Rating label per row; profile 60.6 x5, "1 match" x3, Checkouts heading/label, "times" x3, tooltip date; brand twice on players/home.

## Spacing defects (full list)
New-match phone overflow; Matches/History no gap; placings wrap, final card and groups table clipped on phone; draft truncation, orphan half-width selects, CTA wraps; admin tabs clip Diagnostics; kiosk player cards ~200px dead band; watch on phone; new-match kiosk 280px void; profile orphan tiles, chart/list off the tile grid; display knockout column shrink and empty bottom 40%; display finished empty lower half; off-scale values 14/18/20/22/28/36/40/48px across ui.ts, HomePage, StationPage, StatsPages, TournamentRun, MatchesAdmin; equivalent cards with different insets (px-4 py-3.5 vs px-[18px] py-4); four status-pill heights; home footer void.

## Detector
165 advisory design-system-font-size hits; ~115 false positives because DESIGN.md frontmatter lacks the phone steps documented in prose. Real: 9/10px under the 11px label floor (MatchHistory:162, admin tabs, Throwing), undocumented 14/28/30/32/34/38/40/48/52/56/60px. Browser: low-contrast --faint 1.8:1 on profile sub-label (StatsPages.tsx:363), kicker-above-heading on profile and admin draft, straggler "clear." on admin.
