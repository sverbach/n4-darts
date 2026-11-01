# One word and one font per thing

Status: done
Type: task

From critique run 3 (P2): station state reads "FREE" (Home), "Free" (admin hint text) and a "■ FREE" badge (/display); highest checkout is "HC" (/players), "HIGH OUT" (/display), "HIGHEST" (profile); "KNOCKOUT" sits in /display's header and again as the section label.

## What to do

- Station state: one form everywhere (the status pill: Free, Paused, Board offline), Home, admin and /display.
- Highest checkout: "High out" everywhere a short label is needed (tables, profile tile).
- /display: no section label repeating the header's phase ("Knockout" once).

## Acceptance

- `grep` shows one label per stat; screenshots show one station-state form.

2026-11-01: Built. "Free" is the same neutral status pill on Home, admin tournament, the matches tab and /display (a paused station's pill is already in its title, so the "Paused for the tournament" line went; Home's other states stay words). The highest checkout is "High out" everywhere: /players' column, /display's leaderboard, the profile tile and the award title. /display's single-elimination bracket has no "Knockout" section label under the "Knockout" header (double elimination keeps "Winners bracket" / "Losers bracket"). Names in admin station lines were done in 08.
