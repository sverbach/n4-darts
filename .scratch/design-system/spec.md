# Design system

Status: ready-for-agent

## Goal

Every page gets the look of the mockups in the Design canvas "n4darts — Station View" (https://claude.ai/artifact/HuW84FFVzNBsw7FVAXfy7b), pages "Mobile screens" and "Desktop screens". The early "Station explorations" page is only background.

Read first: `docs/ui-pages.md` (what each page does), `docs/architecture.md`, `GLOSSARY.md`.

## The look

- **Colours.** All of them are CSS custom properties on `:root`, named by role (e.g. `--bg`, `--surface`, `--line`, `--text`, `--muted`, `--accent`, `--ok`, `--warn`, `--danger`), so a theme can later swap them in one place. Values from the mockups:
  - Greys: `#060708` (page), `#0B0D0F`, `#0F1215`, `#1A1D20`, `#2B2F33` (lines).
  - Text `#F2EDE4`, muted `#8C9096`.
  - Accent violet `#A68CFF`, with its tint `#120F1A`.
  - Online green `#5CFFA0`, warning amber `#FFB23D`, danger red `#FF4D3D`.
- **Theme.** Dark only. The light-mode handling goes.
- **Fonts.** Silkscreen for labels, names, buttons and headings, in capitals. Geist Pixel for numbers and running text (VT323 in the mockups, swapped 2026-10-21). Both are bundled (`@fontsource`), so nothing loads from the internet.
- **Shapes.**
  - No rounded corners.
  - Primary buttons are slanted.
  - Small pixel arrows and chevrons as inline SVG.
  - Status pills: a tinted background, a border and a square dot.
  - Violet corner brackets around the avatar on "Game shot" and the champion.
- **Avatars.**
  - An octagon with cut corners, for photos too.
  - Without a photo: the initials on one of the mockups' nine muted colours (`#4B3A7A #1F5249 #6A3F1F #2A4A72 #5A2645 #4A5A22 #6B2E2E #3A4048 #2E5A5A`), picked from the player id.
- **Names in capitals** via `text-transform`. The stored names don't change.
- **The logo** from the canvas goes in `packages/web/public` and appears in the headers as the mockups show.
- **Layouts.** Two layouts, from the mobile and desktop mockups, switching at about 760 px. The kiosk laptop gets the desktop layout.
- **Projector pages.** `/display` and `/watch` keep their scaling to fit the screen, with the proportions of the 1080p and 720p mockups.

## Additions from the mockups

- **Station, End/Cancel match:** this moves into the board menu under a "Match" section; for a tournament match the menu notes "Goes back in the queue". The bottom "End match" button and the lineup's "Cancel" go away.
- **Station, settings strip:** a strip under the station bar shows the match label (if any), start score, in rule (if not straight), out rule, legs, and the current leg.
- **Station, "Next player":** the button shows who is up ("Up: Bob").
- **Station, ignored darts:** an ignored dart is labelled "Ignored".
- **Progress squares:** the `/display` and admin tournament headers show one square per match, filled when played.
- **Profile:** "Rank #n" (the leaderboard position), "n matches · since <month year>" (first counted match), and a small sub-label per stat.
- **Tournament draft:** a "Saved" indicator after each change.
- **Match detail:** a "Live" badge while the match is running, and all legs collapsed except the last.
- **Idle `/display`:** the header reads "Darts evening · <date>".
- The admin knockout keeps the queue and players sections, although its mockup leaves them out.
- No scanlines.

## Out of scope

Theme switching itself (only prepared through the variables), new features beyond the additions above, a light theme.

## Done when

- Every page matches its mockups at 390 px and 1440 px, and `/display` at 1080p and `/watch` at 720p.
- It is checked on the real kiosk laptop and projector.
