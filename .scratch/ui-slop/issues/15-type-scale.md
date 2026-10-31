# Every font size on the type scale, DESIGN.md tokens complete

Status: ready-for-agent
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
