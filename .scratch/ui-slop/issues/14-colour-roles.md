# Accent and status colours back in their roles

Status: done
Type: task

DESIGN.md: violet only for active / selected / primary (One Signal Rule); green, amber, red only for status (Status Lights Rule); the slant only on a screen's CTA; Dead Pixel only for disabled.

- Violet headings "GROUP", "KNOCKOUT" on the display (`H2_ACCENT`, `features/display/DisplayPage.tsx:19`), next to grey "NOW PLAYING".
- Violet hint "Tap a dart to correct it." (`features/admin/matches/MatchHistory.tsx:117`, `match-label`).
- Violet on some profile tiles (`accent: true`, `StatsPages.tsx:245` and others) so nothing stands out.
- Green/red for Won/Lost on the profile (`StatsPages.tsx:319`) and green for the winner row on the display (`DisplayPage.tsx:416`).
- The slant on the S/D/T toggle in the segment picker (`components/SegmentPicker.tsx`); a red "Cancel" there that isn't destructive.
- Profile sub-labels in Dead Pixel on the panel: 1.8:1 contrast (`StatsPages.tsx:363`, `kiosk:text-faint`).

## What to do

- Section headings muted grey everywhere; hints as `hint` (muted).
- Profile: no accent tiles. Decided: the rating stays as it is (value, rank), but not in violet: Phosphor Paper, set apart by position or size rather than colour.
- Won/lost as text ("W" / "L", or "Won" / "Lost") in Phosphor/muted; the display's winner row marked by weight or a ▸, not green.
- S/D/T: square segmented buttons with the pressed state; Cancel a ghost button.
- Sub-labels in Readout Grey (≥ 4.5:1 on panel).

## Acceptance

- `grep` for `text-accent` / `text-ok` / `text-danger` in `packages/web/src` lists only uses that fit the rules (note the list in a Comment).
- Contrast of every text colour on its ground ≥ 4.5:1 (Dead Pixel only on disabled).
- See `../spec.md` "For every ticket".

## Comments

2026-10-31: Confirmed by the user. Rating stays on the profile, not in violet.

2026-11-01: Built. Display: the group and knockout headings are grey like "Now playing"; a station card's thrower row keeps its tint and violet score only (the name is no longer violet), and the winner's row says "Won" in bold, not green. Segment picker: S/D/T are square toggles with the usual pressed state (the slant stays the CTA's), Cancel is a ghost button, and the context ("Ann · Dart 1") moved under the title (it was a label above it). Admin heading counts "(5)" are grey. Profile (done with 08): no accent tiles, the rating first in Phosphor Paper, Won/Lost in words in full colour and grey, sub-labels in Readout Grey (4.5:1+ on the panel; Dead Pixel was 1.8:1). Match history hint (07) is a plain hint.

What's left using these colours, checked against the rules: `text-accent` for the thrower's score (station, watch, display), the segment picker's current segment, game shot's title, station names in headers and cards (from the mockups), match labels ("GROUP A", `match-label`), the ranking column of tables (Rating, Pts) and the leaderboard's top three, selected/pressed states, CTAs, focus, progress squares, the champion. `text-ok` / `text-danger` / `text-warn`: status pills, "Running" and "Saved", bust and the bust dart, diagnostics levels, destructive menu items. Dead Pixel: disabled controls, empty dart slots, the leg dash and route separators (decorative, not text to read).
