# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Players**: a fixed group of friends who meet regularly for darts evenings. They know each other, and the regulars help newcomers. At the board they use the station screen (a kiosk laptop or tablet next to the board, read from 2–3 m, touch). On their own phones they look up stats.
- **Organiser**: one of the group. They set up and run the evening from their phone in `/admin`, and step in only when needed (pause, hold, send back, withdraw, corrections).
- **Spectators**: everyone else in the room, watching `/display` or `/watch/n` on a projector or TV from across the room. They have no input.
- **Operator**: whoever looks after the home server: deploy, backups, diagnostics.

## Product Purpose

n4-darts runs private, offline darts evenings in one room with automatically scored boards. Autodarts boards detect the darts. Everything else is n4-darts' own: scoring X01, matches, tournaments (groups then single or double knockout), scheduling across stations, and long-term stats. Success means the evening runs by itself: players walk up and play, the room follows on the projector, and every finished match adds to each player's history.

## Positioning

- **Fully offline and self-hosted.** One server in the room. No internet, no accounts, no logins. Stations are URLs, and only `/admin` sits behind a shared PIN (ADR 0004, 0005).
- **Long-term stats per player, in one private history.** Ratings, profiles, the leaderboard and tournament awards build up over many evenings, for this group only.

## Operating Context

- A room with a few stations. Each station is one board plus its screen(s), and the station screens run full-screen in kiosk mode.
- `/display` stays open full screen on the projector all evening and follows it by itself: live scores and up next, the group tables, then the bracket, then the champion, placings and awards.
- Every page except stats and home updates live (Server-Sent Events). Nobody refreshes.
- A visit ends at takeout, when the player pulls the darts (ADR 0003). Players fix misdetections at the board, and the organiser fixes them from match history.
- Pages and their devices are listed in `docs/ui-pages.md`. Terms follow `GLOSSARY.md` (station, visit, takeout, organiser and so on, never their "avoid" words).

## Capabilities and Constraints

- Requirements: `docs/architecture/01-introduction-and-goals.md` (PLAY, MATCH, TOUR, SCHED, STATS, VIEW, ADMIN, OPS).
- Stack: TypeScript end to end (ADR 0006), React web app, no client state library (ADR 0007). Fonts and assets are bundled, and nothing may load from the internet at runtime.
- Projector pages (`/display`, `/watch`) fit any screen without scrolling.
- Status indicators use only "ok" and "warn". Destructive actions ask for confirmation first.
- Theme: dark only today. Colours are role-named CSS variables, so a theme can be added later.

## Brand Commitments

- The name **n4-darts** and the sparkle logo (`packages/web/src/assets/logo-sparkle.png`) are binding.
- UI copy is **English only**. i18n is not a requirement.
- Voice: plain, short, in everyday words, and using the glossary's terms.

## Evidence on Hand

- Real board recordings: `prototypes/recordings/` (e.g. `2026-10-18-board1.txt`).
- The visual baseline of every page and state: `packages/e2e/tests/visual.spec.ts-snapshots/`.
- Mockups: Design canvas "n4darts — Station View" (https://claude.ai/artifact/HuW84FFVzNBsw7FVAXfy7b).
- There are no testimonials, external users, press or public deployment. Don't invent any.

## Product Principles

1. **The evening runs itself.** The organiser steps in only on exceptions, and players never need anyone to start their match.
2. **Every dart must be right.** Detection can be wrong, so correcting it is always close at hand and the original detection is kept.
3. **Readable where it's used.** Station screens work from 2–3 m by touch, the projector from across the room, admin and stats one-handed on a phone.
4. **Nothing leaves the room.** No internet dependency, accounts or tracking.
5. **History is the reward.** Every counted match feeds stats the group comes back to.

## Accessibility & Inclusion

- Station screens: large touch targets and text readable at 2–3 m.
- Projector pages: legible from across the room on 1080p and 720p screens, with no interaction.
- Admin and stats: usable at phone width (390 px).
