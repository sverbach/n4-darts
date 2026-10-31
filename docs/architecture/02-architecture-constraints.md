# 2. Architecture constraints

What the design has to live with. They come from the room, the boards and the people who run it.

## 2.1 Technical

- **Detection is Autodarts.** Each station has an Autodarts board with its Board Manager on a Windows laptop. n4-darts uses only its local, unofficial and unauthenticated API (state snapshots plus start, stop, reset, calibrate). An update by the vendor can break it (ADR 0001, `docs/board-manager-api.md`).
- **Nothing of ours on the laptops.** They run the Board Manager and a browser in kiosk mode (arch).
- **One server in the room.** A Linux machine with Docker on the same network as the boards (arch).
- **Two stations today.** Nothing should assume exactly two (arch).
- **If the server is down, nobody can play.** A relay on the laptops that buffers darts was rejected (ADR 0001).
- **Offline.** Nothing may be loaded from outside the room at runtime: no CDN, no web fonts, no icons from the internet (ADR 0005).
- **Linux and Docker on the server, a browser on the laptops.** The operator deploys one image with one data volume (Q-18).

## 2.2 Organisational

- **Organiser, operator and developer are often one person.** The system has to be runnable and fixable by them alone, on an evening, without a vendor.
- **The room is private.** No public access and no logins for players (ADR 0004); the PIN keeps guests from editing by accident, not attackers.
- **Every change ships through CI.** Typecheck, lint, tests (including the load test), browser tests and the build all pass before an image is published.

## 2.3 Conventions

- **TypeScript end to end** (ADR 0006), a pnpm workspace with one package per part (section 5).
- **Terms** follow [`GLOSSARY.md`](../../GLOSSARY.md); **decisions** that are hard to reverse get an ADR in [`docs/adr/`](../adr/).
- **Diagrams** in the docs are Mermaid code blocks.
- **Web features don't import each other.** Each page is a folder under `packages/web/src/features/`; what two of them use lives in `components/` or `lib/`. `pnpm lint` fails otherwise (section 5.2).
- **No import cycles,** in any package, type-only imports included: dependencies point one way. `pnpm lint` fails otherwise (Biome's `noImportCycles`).
