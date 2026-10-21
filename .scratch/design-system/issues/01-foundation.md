# Foundation: tokens, fonts, logo, shared pieces

Status: done
Type: task

- **Tokens.** Colour, spacing and type tokens as CSS variables on `:root` in `styles.css`, named by role. Light mode removed. `body` gets the page background.
- **Fonts.** Silkscreen and VT323 via `@fontsource`, imported in `main.tsx`.
- **Logo.** The logo blob from the canvas saved to `packages/web/public/logo.png` (or whatever its type is).
- **Base styles.** Base styles for buttons (primary slanted, secondary, ghost, danger), inputs, selects (a pixel chevron), panels, section labels, tables, status pills and errors, so the existing pages pick up the look before their own tickets.
- **Avatar.** Becomes an octagon, with the nine-colour palette by id.
- **Names.** Names in capitals through CSS.
- **Pixel icons.** A small `PixelIcon` component (arrow right/left/up/down, chevron, trophy).

## Acceptance

- All checks pass.
- A screenshot of each page at 390 px shows the new base look, with nothing broken or unreadable.

## Comments

**2026-10-21, done.**
- **Stylesheet split.** `styles.css` now imports `styles/tokens.css` (every colour as a role-named variable, the nine avatar colours and the two font stacks; dark only), `styles/base.css`, `styles/avatar.css`, and `styles/legacy.css`. `legacy.css` holds the old page rules; later tickets move their part out of it.
- **Base styles.** Type (pixel headings in capitals, `.label`), buttons (default, `.primary`, `.cta` slanted, `.ghost`, `.danger`, pressed, disabled), fields with a pixel chevron on selects, `.status` pills (ok, warn, danger, accent), `.error` and `.notice`, `.panel`, tables, collapsible sections with a turning caret, and `.back`.
- **Fonts.** `@fontsource` Silkscreen 400/700 and VT323, imported in `main.tsx`.
- **Logo.** A `Logo` component draws the logo as inline pixel SVG in the text colour, instead of a file in `public/`, so a theme can recolour it.
- **`PixelIcon`.** arrow, caret, back, up, down, dots, trophy.
- **`Avatar`.** An octagon (photo or initials) using the nine colours, sized by `--avatar`. A single-word name now gives two letters ("AN"). `.avatar-frame` draws the corner brackets.
- Screens checked at 390 px: every page has the new base look.
