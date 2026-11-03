---
target: run 4 after ui-slop-2 08-12
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/sver/Projects/n4-darts/packages/web/src"
timestamp: 2026-11-02T22-23-42Z
slug: packages-web-src
---
# Critique run 4 (after ui-slop-2 08-12): packages/web/src

Score 29/40 (Good). Method: dual-agent. No P0, no P1. Detector: 4 advisory findings, all false positives (champion avatar-frame em sizing at TournamentRun.tsx:210 ×2, heatmap SVG user units at Heatmap.tsx:79, scroll-x fade gradients at app.css:441 read as a grid background). Browser (headless Playwright fallback; MCP browser lacked Chrome): no document-level overflow; station and projector text ≥12px except avatar initials; off-scale spacing only in allowed projector pu-* units.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of status | 3 | "Remove darts" is an 18px line in the visit panel |
| 2 | Match real world | 3 | Dart slots labelled D1/D2/D3 read as doubles |
| 3 | User control | 3 | SegmentPicker has no Escape/focus trap |
| 4 | Consistency | 3 | Three date formats; heatmap uses warn amber as decoration |
| 5 | Error prevention | 3 | "Next player" styled as the primary CTA invites habitual taps |
| 6 | Recognition | 3 | Seeds drifted from rating order without a marker or reset |
| 7 | Flexibility | 2 | No fast path for the organiser in the queue |
| 8 | Minimalist | 3 | Under-filled projector; permanent hint paragraphs in admin |
| 9 | Error recovery | 3 | Good; error states not exercised live |
| 10 | Help | 3 | Contextual one-line hints, appropriate |

## Specificity
Specific to a darts evening: pixel numerals, Silkscreen capitals, slanted CTA, octagon avatars, violet brackets reserved for game shot and champion. Generic spots: under-filled idle/knockout projector, admin as a plain form stack, heatmap glow.

## Priority issues
1. [P2] /watch remaining score overflows its card at 3 digits (1920: glyph ends x=996, card 948; 1280: 664 vs 632). PlayerCards.tsx:36/:55, 55cqw too wide for Geist Pixel. Fix: cap ~min(125cqh, 48cqw), add 3-digit watch snapshot. harden.
2. [P2] Station "Next player" is the one slanted violet CTA through every visit while "Remove darts" is an 18px line (StationPage.tsx:271-284, :30). Demote Next player; make Remove darts a big banner during awaitingTakeout. layout.
3. [P2] Station text read from 2-3 m at 13-18px (rules strip, "Last 39", D1-D3, board pill); D1/D2/D3 ambiguous. typeset.
4. [P2] Profile "Average per evening" chart on phone: y labels clipped ("160"→"60"), 13 gridlines, last x label clipped (StatsPages.tsx:405-447). polish.
5. [P3] Idle /display and knockout leave 40-50% of the screen black. layout.

## Cognitive load
2 failures (moderate): station has two competing violet masses (score and Next player); admin draft shows 11 selects incl. double-knockout-only ones for single knockout.

## Personas
Organiser: no batch actions in queue, permanent hint paragraphs, phone tab bar hides Sound/Diagnostics, no reset-to-rating for seeds. Sam: SegmentPicker without aria-modal/Escape; 11px Silkscreen names in group tables. Casey: home station line truncated, /players table scrolls 15px at 390, "With brac…" truncated. Player at 2-3 m: rules, Last, and Remove darts unreadable; NEXT PLAYER reads as "press me".

## Minor
"You can change the order next." before anyone is picked; singular GROUP heading on /display; "1-0-0" in 3-player history; avatar-7 near alarm red at game shot; undecided final rows "–"/"–" look like data; admin finished puts New tournament CTA above the champion; heatmap glow vs no-glow stance.

## Questions
Why is the manual override the biggest button at the board? Should idle /display be scoreboard-first? Should the 2-3 m rule set a ~24px floor for every word a player needs at the station?
