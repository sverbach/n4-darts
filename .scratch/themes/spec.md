# Themes: the theme star

Status: ready-for-agent

The original mockup (Design canvas "n4darts — Station View") explored more accents than violet: Terminal cyan, Phosphor green, Synth magenta, Caution yellow and Mecha orange. The user wants them selectable, fun and unobtrusive, on every screen, by everyone, plus a light theme ("funny to see").

## Decisions (2026-11-07)

Shaped with the impeccable skill and confirmed by the user.

- **Per device:** the choice is kept in that browser (`localStorage`) and applied before the first paint. No server, no PIN. Kiosks and the projector keep what was picked on them.
- **The theme star:** a 4-pointed pixel star (the favicon's shape) in the current accent, a 44 px target, next to the logo in every page's top bar: home, station (also on a phone, beside the board menu), /watch, /display, the stats pages, admin, the public site's gate. The logo itself stays the link home. A tap moves to the next theme, and its name flashes beside the star for about 1.5 s. On home, the big sparkle logo cycles too (an easter egg). Reduced motion: no animation.
- **Seven themes in a fixed order:** Unit violet (the default, today's), Terminal cyan, Phosphor green, Synth magenta, Caution yellow, Mecha orange, Daylight; then round again.
- **The dark themes** swap only the accent family: `--accent`, `--accent-text`, `--accent-tint`, `--accent-line`. Everything else stays.
- **Daylight** is a full light palette: a paper ground, ink text, light panels and lines, a deeper violet accent, darker status colours, the heat ramp reversed (few = pale, most = deep red) and the series palette's light steps. The sparkle logo's PNG is inverted to ink.
- **Known overlap:** Phosphor green's accent is the status green, and Caution yellow is close to the status amber. Status pills always carry a label, so that's accepted.

## Out of scope

- A room-wide theme from the server; more light themes; themes per player.

## Tickets

1. `01-theme-star.md`: the mechanism (tokens per theme, the early script, the store) and the star on every page, with the six dark themes
2. `02-daylight.md`: the light palette
3. `03-checks-and-docs.md`: contrast checks, visual shots, DESIGN.md and the docs
