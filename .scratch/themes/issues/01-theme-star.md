# Themes: the theme star and the dark accents

Status: ready-for-agent
Type: task

- Tokens per theme under `:root[data-theme="…"]` in `styles/theme.css`, each accent family derived in OKLCH from the mockup's accent (tint and line as dark as violet's today).
- An inline script in `index.html` sets `data-theme` (and `theme-color`) from `localStorage` before the app loads.
- `lib/theme.ts`: the list, the stored choice, the next theme, a store every star follows.
- `components/ThemeStar.tsx`: the pixel star button with the name flash; placed next to the logo on every page; the home page's sparkle logo cycles too.

Acceptance: a unit test for the cycle and the stored choice; an e2e test that the star moves on and the choice survives a reload; checked at 390 and 1440 px in two themes; all checks pass.
