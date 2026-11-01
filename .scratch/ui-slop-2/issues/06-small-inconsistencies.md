# The re-critique's minor list

Status: needs-triage
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
