# One format for totals, scores, dashes and pills; better hints

Status: ready-for-agent
Type: task

- Visit totals: "040" and "000" on the projector, "40" on the station; an idle station's "—" and "000" read like data to the room.
- Dashes: "-" and "—" for the same thing (placings, empty values).
- Leg scores: "0-0" and "0:0".
- Pills: "BOARD ONLINE" vs "ONLINE" (diagnostics); "STATION 2 ■ FREE" on the idle display is an untinted pill.
- Hints: obvious ones repeat ("Tap a dart to correct it" twice on the phone) while real questions get none ("Advance per group", what seeding "by rating" uses).

## What to do

- One helper per value kind in `lib/` (total, leg score, placing range, empty value) and use it everywhere. Totals unpadded; an idle station shows nothing (or "Free"), not zeros.
- Leg score with "–" (en dash) everywhere; empty values one dash.
- Pill wording the same on every page; every pill is a real status pill (tint, line, colour) per DESIGN.md.
- Hints: one per screen at most; add short hints to the tournament draft's "Advance per group" and seeding.

## Acceptance

- Unit tests for the helpers; no screen formats these by hand.
- See `../spec.md` "For every ticket".

## Comments

2026-10-31: Confirmed by the user.
