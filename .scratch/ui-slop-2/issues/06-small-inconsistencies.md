# The re-critique's minor list

Status: done
Type: task

Small things from the re-critique; each is quick.

- Names: mixed case in admin station rows ("Ann vs Dee") and match detail, capitals elsewhere; one case everywhere (capitals via `text-transform`, DESIGN.md's Stored-Name Rule).
- "Correct S20" sets a dart value in Silkscreen (Two-Voice Rule): the value in Geist Pixel.
- Profile tiles: label and value at the same place in every tile (some labels sit top, some bottom; values at different heights across a phone row).
- The draft's "Takes about 1 h 30." is in a green ok notice: an estimate isn't a status; a plain line.
- Diagnostics: every timing is green whatever its value; show warn/danger by its thresholds, and as a pill or with a word, not colour alone.
- "Free" and "Running" are bare coloured or grey words: status pills (Status Lights Rule).
- History rows "Bob vs Dee 1–0" don't say whose 1 (the winner is only full colour): put the winner first, or "Bob won 1–0" in one place.
- /players: Rating and Avg are the same number under 10 matches; show Avg only where it differs, or explain.
- Progress squares: a visible label ("6 of 9") somewhere on the projector, or a legend.
- DESIGN.md says the CTA text is 15px (stale; it's 16/20).
- /admin intro copy wraps with a one-word last line: `text-wrap: pretty` on page leads; line-height 1.3+ on multi-line hints.
- Home's "Watch" reads as disabled (grey 12px): secondary, not disabled.
- The PIN field: masked input and a clear placeholder; the label isn't repeated.

## Acceptance

- Each item fixed or, if decided against, noted here with why.

## Comments

2026-11-01: Confirmed by the user ("go ahead with the ui-slop-2 tickets").

2026-11-01: Built, item by item:
- Names: the running summaries that showed mixed case (admin tournament station rows, the matches tab's station cards, Home's station line) are in capitals via `text-transform`. Sentences like the match detail's "Ann won …" stay sentences.
- The segment picker takes the dart separately (`dart` prop): "CORRECT" in Silkscreen, "S20" in Geist Pixel; the dialog's name is unchanged ("Correct S20").
- Profile tiles: the label at the top, the value right after it on a phone (bottom right on the kiosk), the sub-label at the foot, so values line up across a row.
- The draft's estimate is a plain line, not a green notice.
- Diagnostics: a fine timing is plain text; a slow one is amber with "slow", a very slow one red with "too slow" (not colour alone).
- "Running" / "Finished" / "Draft" / "Live" are small status pills (`runState`). "Free" stays a plain word: it says what's on a station, not a status to act on.
- History: the winner comes first ("Bob vs Dee 1–0" is Bob's 1), and the legs follow the same order.
- /players: while a player has 10 matches or fewer, Avg is grey (with a title saying it equals the rating until then).
- Progress squares show "6 / 9" beside them (/display and admin).
- DESIGN.md: the CTA text is 16px (20 on the kiosk).
- `hint`: line-height 1.3 and `text-wrap: pretty` (no one-word last lines in page leads).
- Home's Watch link is Phosphor Paper, not grey.
- PIN: one label, "Enter the PIN to unlock", and a "••••" placeholder; the field was already masked.

Browser tests updated for the PIN label. Two server timing tests (load, restart scenario) failed once while the machine was busy and passed on the next two runs.
