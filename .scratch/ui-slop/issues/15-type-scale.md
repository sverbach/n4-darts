# Every font size on the type scale, DESIGN.md tokens complete

Status: done
Type: task

The Impeccable detector flags 165 font sizes outside DESIGN.md. About 115 are false positives: the frontmatter lists only the kiosk sizes, while the prose documents the phone sizes (26/16/20/11px) and others. The real problems:

- Below the 11 px label floor: 9 px (`features/admin/matches/MatchHistory.tsx:162`), 10 px ×7, including "Throwing" (`components/PlayerCards.tsx:96`, goes in 01) and the admin tab labels.
- Sizes on no step: 14 ×17, 19, 21 ×2, 28 ×9, 30, 32, 34, 38, 40, 48, 52, 56, 60 px (file list in the critique snapshot).
- Two-voice slips: "25" on the correcting screen and "1 dart" in the wrong font for their role.

## What to do

- Decide the type scale per role and width (phone / kiosk; projector in `pu-*` stays as is), including the stat and big-number steps actually needed (e.g. 40/48 for stat values, 96/160 for game shot).
- Snap every size in `packages/web/src` to it; nothing under 11 px.
- DESIGN.md frontmatter: add the phone and stat steps as tokens (e.g. `headline-phone`, `stat-value`) and the sidecar `.impeccable/design.json` regenerated (`/impeccable document`, refresh).

## Acceptance

- `impeccable detect --json src` (from `packages/web`) reports no `design-system-font-size` findings, or only documented projector exceptions.
- See `../spec.md` "For every ticket".

## Comments

2026-10-31: Confirmed by the user.

2026-11-01: Built. The scale, per DESIGN.md's new Scale Rule: 11 · 12 · 13 · 16 · 18 · 20 · 22 · 24 · 26 · 28 · 32 · 36 · 40 · 48 · 56 · 72 · 96 · 160px, the score's clamps and the projector's `pu-*` units aside; nothing under 11. 42 sizes snapped (9, 10 → 11; 14 → 13; 15 → 16; 19 → 20; 21 → 22; 30 → 28; 34 → 32; 38 → 36; 44, 52 → 48; 60 → 56) plus the CTA's 15 → 16 in `app.css`. DESIGN.md's frontmatter now lists every step as a role token (phone and kiosk headline/title/body/label, button, field, stat values, dart, game shot title and legs, names and numbers); the sidecar should be refreshed with `/impeccable document` (left for 16). Two-voice slips: the segment picker's "25" is in Geist Pixel like 1–20; an award's unit ("darts") is a small Silkscreen label beside its number. `impeccable detect --json src` now reports one finding: Heatmap's `0.09px`, an SVG viewBox unit, not a CSS size (a false positive). Also: an odd last award takes the whole row in admin (it was an orphan on phones).
