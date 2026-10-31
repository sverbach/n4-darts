# The station in Tailwind

Status: done
Type: task
Blocked by: 03

Move the station page's styles (`station.css`) into Tailwind classes, and delete `station.css` (`../spec.md`). Nothing may look different.

## Steps

- Rewrite the classes of `features/station/` and the pieces only the station uses as Tailwind utilities on the theme's roles (no raw colours or font names).
- Anything that can't be a utility (keyframes, a selector that's clearer as CSS) goes to `styles/app.css`, with a line saying why.
- Remove `station.css` and its import from `styles.css`.
- Run the visual suite after each larger step, not only at the end.
- The kiosk layout (at 760 px and up) and the phone layout both checked: the station has the most layout differences between the two.

## Acceptance

- `station.css` is gone; no class from it is left in the markup.
- The visual suite passes at zero tolerance against the baseline from ticket 01, at every size. Any difference that's accepted instead is listed in the comments with a screenshot and the reason.
- `pnpm lint` passes, so every class list is sorted.
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Docs:** `docs/architecture/08-crosscutting-concepts.md` (8.6, "Styles") no longer lists `station.css`.

## Comments

2026-10-31: Confirmed by the user ("go straight through 03–08").

2026-10-31: Built. `station.css` is gone; the station's frame, bar, settings strip, new-match screen, lineup, match actions and visit panel are utilities in `StationPage.tsx`, with a few named class constants (`CONTROLS`, `SECONDARY`, `MOVE`, `DART`, `VISIT_STATUS`). The dart tiles get their state (bust, busted, ignored, empty, add) from code, matching the old cascade, including that a bust frames the empty and add tiles in red.
- **Split:** the scoreboard cards and the game shot (`PlayerCards`, `MatchOver`) are shared with `/watch`, where `display.css` adjusts them with `.watch …` rules; for a scoreboard of three or more players some station rules win over those today by specificity, and the suite only has two players. So those rules moved unchanged to `styles/scoreboard.css`, in `station.css`'s place in the cascade, and move to utilities with the watch rules in ticket 05 (added to that ticket).
- **Exact values:** `grid-cols-N` is `repeat(N, minmax(0, 1fr))`, not `1fr 1fr`: the phone's two-column settings came out different. Grids with plain `fr` columns use the original value as an arbitrary one (also fixed in `SegmentPicker`).
- Nested rules into shared components (the quick match's settings grid) use arbitrary variants on the section (`[&_.settings]:grid-cols-[1fr_1fr]`).
- Visual suite: all 66 screenshots at zero tolerance. All checks pass.
