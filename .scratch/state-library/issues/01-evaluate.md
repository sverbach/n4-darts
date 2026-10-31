# Would a small state library improve the web app?

Status: needs-triage
Type: research

An analysis, no code changes: would introducing a small client-side state library (e.g. [Zustand](https://zustand.docs.pmnd.rs)) make `packages/web` easier to understand and change, or would it add a layer for nothing? The answer goes into `analysis.md` next to this ticket, with a recommendation the user decides on.

## Questions to answer

1. **What state is there today, and where?** An inventory from the code:
   - server state that arrives live (`useLive` over SSE: station, display, tournament, matches, stations) and by request (`fetch` in `usePlayers`, the stats pages, `adminApi.ts`);
   - UI state per page (`useState`: forms, pickers, open menus, the PIN session, save status);
   - state passed down through props (`send` functions, views) and how deep.
   For each: who reads it, who changes it, and how it's kept fresh.
2. **Where does it hurt, concretely?** Prop drilling, duplicated fetching, state that two places keep separately and can disagree, re-render cost, code that's hard to test. Point at files and lines; "it would be cleaner" doesn't count.
3. **What would a library change?** For the two or three worst spots from (2): what the code looks like with Zustand, and with the alternatives that fit the problem better:
   - React context plus `useReducer` (no dependency);
   - Jotai (atoms);
   - TanStack Query, if the pain turns out to be server state (fetching, caching, refetching) rather than client state;
   - doing nothing.
   Short sketches, not working code.
4. **What does it cost?** Bundle size, a second way to hold state next to `useState`, how it plays with the live views (the server is the source of truth and pushes whole views), testing, and what a newcomer has to learn.
5. **Recommendation.** Introduce one (which, and for what exactly, as a follow-up ticket), or not (and what would change the answer later).

## Constraints

- The server is the source of truth: every live view is pushed whole over SSE (`docs/architecture/08-crosscutting-concepts.md`, 8.3). A client store must not become a second copy that can drift.
- Fully offline (ADR 0005): any library is bundled.
- Use primary sources (the libraries' own docs, sizes from their published packages), and say which version each figure is for.

## Acceptance

- `analysis.md` answers the five questions, with references to our files.
- A clear recommendation with its reasons, and the follow-up ticket written out if it's "yes".
- No changes outside `.scratch/state-library/`.

## Comments
