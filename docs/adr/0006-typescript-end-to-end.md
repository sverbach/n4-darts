# TypeScript end to end, with the game engine as a shared package

Server (Node) and frontend (React + Vite) are both TypeScript in one pnpm workspace, so the X01 rules live in a dependency-free `packages/engine` that the server uses as the authority and the browser imports for instant feedback and checkout hints. Python or Go on the server were the alternatives, but either would mean duplicating or dumbing down the rules on the client.
