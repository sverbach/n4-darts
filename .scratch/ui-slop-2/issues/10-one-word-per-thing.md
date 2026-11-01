# One word and one font per thing

Status: ready-for-agent
Type: task

From critique run 3 (P2): station state reads "FREE" (Home), "Free" (admin hint text) and a "■ FREE" badge (/display); highest checkout is "HC" (/players), "HIGH OUT" (/display), "HIGHEST" (profile); "KNOCKOUT" sits in /display's header and again as the section label.

## What to do

- Station state: one form everywhere (the status pill: Free, Paused, Board offline), Home, admin and /display.
- Highest checkout: "High out" everywhere a short label is needed (tables, profile tile).
- /display: no section label repeating the header's phase ("Knockout" once).

## Acceptance

- `grep` shows one label per stat; screenshots show one station-state form.
