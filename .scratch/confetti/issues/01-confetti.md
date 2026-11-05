# Confetti on the game shot and the champion

Status: done
Type: task

See the spec's decisions.

## What to do

- Add `react-confetti` (exact version) to `@n4/web`.
- `components/Confetti.tsx`: one burst over the whole window. It's fixed, ignores the pointer and sits above the page; its colours come from the tokens; it renders nothing under reduced motion and unmounts when the burst is done.
- Use it in `MatchOver` (station and `/watch`) and on `/display`'s champion.
- `playwright.visual.config.ts`: `reducedMotion: "reduce"`.

## Acceptance

- The confetti shows on a game shot at the station, on `/watch` and on `/display`'s champion, and stops by itself.
- A unit test: nothing renders under reduced motion.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm e2e` and the visual suite pass, with the snapshots unchanged.

## Comments

2026-11-05: Done.
- `react-confetti` 6.4.0 is in `@n4/web`. `components/Confetti.tsx` draws 400 pieces with `recycle={false}` over a fixed canvas (z-index 50). Its colours are read from the tokens on mount, and it unmounts on `onConfettiComplete`.
- It's used in `MatchOver` (station and `/watch`) and on `/display`'s champion.
- The unit test (`Confetti.test.tsx`) checks that the canvas renders and that nothing renders under reduced motion.
- **Checked on the production build** with reduced motion off, in the visual flow: the canvas is up at the game shot on the station and on `/watch`, in the theme's colours, and gone about 10 s later.
- The visual suite (`reducedMotion: "reduce"`) passes with the snapshots unchanged, and so do e2e (41) and the unit tests (717).
