# Themes: Daylight

Status: done
Type: task
Blocked by: 01

- `:root[data-theme="daylight"]`: grounds, text, lines, accent family, status colours (and their tints and lines), scrim, `color-scheme: light`; the heat ramp reversed; the series palette's light steps (validated in light mode).
- The sparkle logo inverted to ink; anything else drawn in a baked colour found and fixed.

Acceptance: checked page by page at 390 and 1440 px (home, station, /watch, /display, profile, match page, admin); all checks pass.

## Comments

2026-11-07: Done.
- **`:root[data-theme="daylight"]`:** paper grounds (bg #ede7dc, panel #f6f2ea, surface #fdfbf6), ink text #16140f, muted #5d584f, a deep violet accent #5a3ed0 with paper text on it, darker status colours with light tints and lines, a lighter scrim, `color-scheme: light`. Contrast on bg / panel / surface: text ≥ 14.9, muted ≥ 5.7, accent ≥ 5.6, ok/warn/danger ≥ 4.7, each status on its own tint ≥ 4.9, paper on accent 6.7 (faint is for disabled and decorative only, as in the dark themes).
- **Avatars:** the dark grounds would have put ink initials on dark colours, so Daylight has pastel grounds in the same hues (OKLCH L 0.84), each ≥ 10.9:1 with ink.
- **Heat** reversed (few = pale yellow, most = deep red). **Series:** the dataviz reference's light steps, violet first. The validator passes; its two warnings (four colours under 3:1 on the panel, green↔red CVD 7.2) are the documented relief cases: every series colour sits next to the player's name.
- **Hard-coded colours:** the `scroll-x` edge shadows now use `color-mix(var(--text) 40%)`; the sparkle logo's sheet (`.logo-sheet`) is inverted in Daylight.
- Checked on the local database at 390 and 1440 px (1920 for /display): home, profile (the heatmap reversed), the match page (race, heatmaps, scoresheet), the station's new match, /display's champion, admin's matches.
- typecheck, lint, 817 unit tests, build and the visual suite (default theme unchanged) pass.
