# Themes: the theme star and the dark accents

Status: done
Type: task

- Tokens per theme under `:root[data-theme="…"]` in `styles/theme.css`, each accent family derived in OKLCH from the mockup's accent (tint and line as dark as violet's today).
- An inline script in `index.html` sets `data-theme` (and `theme-color`) from `localStorage` before the app loads.
- `lib/theme.ts`: the list, the stored choice, the next theme, a store every star follows.
- `components/ThemeStar.tsx`: the pixel star button with the name flash; placed next to the logo on every page; the home page's sparkle logo cycles too.

Acceptance: a unit test for the cycle and the stored choice; an e2e test that the star moves on and the choice survives a reload; checked at 390 and 1440 px in two themes; all checks pass.

## Comments

2026-11-07: Done.
- **Tokens:** `:root[data-theme="cyan|green|magenta|yellow|orange"]` override `--accent`, `--accent-tint` and `--accent-line`. The tint and line are the mockup accent's hue at violet's own OKLCH lightness and chroma (tint L 0.178 C 0.023, line L 0.337 C 0.054), so every theme's tinted surfaces are equally dark. The accent text stays `#060708`; the lowest contrast is magenta at 6.1:1, cyan, green and yellow are above 12:1.
- **`lib/theme.ts`:** `THEMES` (seven, Daylight last), `localStorage` key `n4-theme`, `themeAfter`, `useTheme()` (a `useSyncExternalStore` store, following other tabs through the `storage` event). Violet has no attribute. `index.html` sets `data-theme` and the `theme-color` meta before the app loads.
- **`components/ThemeStar.tsx`:** a 15 × 15 pixel star (the favicon's) in `text-accent`, `aria-label` "Theme: Unit violet. Next theme". A tap moves on, and the name flashes beside it in an accent-tinted box for 1.5 s (`theme-flash` keyframes, still with reduced motion), with a `role=status` for screen readers. Placed on the station (also on a phone), /watch, /display (both layouts), the stats frame, the admin header, the PIN screen, the public site's gate and home (top right). Home's sparkle logo is a button that cycles too.
- **Tests:** `theme.test.ts` (the order), `e2e/tests/theme.spec.ts` (the star moves on, the status names the theme, a reload keeps it). The visual suite's 104 changed shots only add the star; four were checked by eye (admin and station headers on a phone, the PIN screen, /display's header).
- Checked in magenta (home, profile, /watch), yellow (the station on a phone), orange (/display), and the flash after a tap.
- typecheck, lint, 817 unit tests, build, e2e (43) and the visual suite (9) pass.
