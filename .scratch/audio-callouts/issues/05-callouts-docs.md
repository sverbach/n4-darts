# Callouts in the docs

Status: done
Type: task
Blocked by: 03, 04

## What to do

- README: switching sound on (kiosk, phone at the speakers), uploading a darts-caller pack.
- `docs/ui-pages.md`, architecture (building blocks: the caller; deployment: packs in the data volume; quality: no effect on dart latency), DESIGN.md (the speaker button and the tap prompt).

## Comments

2026-11-02: Confirmed by the user.

2026-11-02: Done. README: a "Sound" paragraph under running a tournament (switching it on at the kiosk, a phone at the speakers on /watch, the tap after a reload, uploading a darts-caller pack, and the licence caveat), and packs in the volume but not in the backups. `docs/ui-pages.md`: the Sound building block and top bars (from 03), plus `/admin/sound`. Architecture: 05 gains the `callouts/` server module, the Sound admin tab and the web caller pieces; 07 adds `callouts/` in the data volume and phones at the speakers; 10 adds Q-19 (sound costs the dart nothing, late calls are skipped). DESIGN.md: "Sound Switch" (the speaker button, the board-menu entry, the tap prompt). GLOSSARY: "Call" and "Voice pack". No ADR: no structural decision beyond the spec.
