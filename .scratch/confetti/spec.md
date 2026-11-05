# Confetti on the game shot

Status: ready-for-agent

A burst of confetti over the big moments: the game-shot screen (`MatchOver`, on the station and on `/watch/n`) and the champion on `/display` at the end of a tournament.

## Decisions (2026-11-05)

- **`react-confetti`** at an exact version, bundled, so it works offline (ADR 0005).
- **One burst** of about 5 s (`recycle={false}`), then the canvas goes away. It doesn't keep running on the kiosks, and the stats underneath stay readable.
- **Colours from the design tokens** (`--accent`, `--ok`, `--warn`, `--danger`, `--text`), read when the burst starts, so it follows the theme.
- **Nothing under `prefers-reduced-motion: reduce`.**
- **The visual suite emulates reduced motion**, so the game-shot and champion snapshots stay stable without a test-only flag.
- **Fires whenever the screen appears,** including on a page loaded while it's already showing.

## Tickets

1. `01-confetti.md`
