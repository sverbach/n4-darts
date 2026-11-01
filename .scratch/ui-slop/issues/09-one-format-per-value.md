# One format for totals, scores, dashes and pills; better hints

Status: done
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

2026-11-01: Built. `lib/format.ts` (with `format.test.ts`): `NONE` ("–"), `average`, `count`, `legScore` ("2–1"), `placing` ("3–4"), used by display, admin (tournament, matches, players, draft), stats and the bracket card; the three copies of `place` went. Visit totals unpadded on /display and /watch, and empty before the first dart (no "000", no "—" in empty dart slots). Admin's group table and fixture results use "–" instead of ":". Pills: diagnostics' board column is a real status pill ("Online" / "Offline", danger like the board status); the idle /display's "Free" / "Paused" / "Board offline" are real status pills. Hints: the draft explains "Advance per group" and how seeds are worked out (replacing the "By rating" label); the draft's player picker no longer numbers picks (they looked like seeds); the draft's "Draft" moved from above the title to beside it. Formats listed at the end of `docs/ui-pages.md`. The rating on the draft's seeds (Bob 29.2) differing from /players (39.0) is left to 16 to verify.
