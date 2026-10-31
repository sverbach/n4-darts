# n4-darts architecture

The architecture of n4-darts, following the [arc42](https://arc42.org) template (version 9.1). Terms follow [`GLOSSARY.md`](../../GLOSSARY.md); the key decisions are the ADRs in [`docs/adr/`](../adr/).

Status: **draft** (2026-10-31), for review. It describes the system as built and agreed so far.

| # | Section | What's in it |
|---|---|---|
| 1 | [Introduction and goals](01-introduction-and-goals.md) | What n4-darts is for, the function overview, every functional requirement, the quality goals and the stakeholders |
| 2 | [Architecture constraints](02-architecture-constraints.md) | What the design has to live with |
| 3 | [Context and scope](03-context-and-scope.md) | Who and what n4-darts talks to, in business and technical terms |
| 4 | [Solution strategy](04-solution-strategy.md) | The few ideas the design rests on, and the stack |
| 5 | [Building block view](05-building-block-view.md) | The parts that run (level 1), and inside the server and the web app (level 2) |
| 6 | [Runtime view](06-runtime-view.md) | A dart from the board to the screens, a correction, a restart, the scheduler |
| 7 | [Deployment view](07-deployment-view.md) | The room: server, laptops, network, image and volume |
| 8 | [Cross-cutting concepts](08-crosscutting-concepts.md) | Event log, live updates, access, offline, design system, testing, operations |
| 9 | [Architecture decisions](09-architecture-decisions.md) | The ADRs and the decision log |
| 10 | [Quality requirements](10-quality-requirements.md) | Every quality requirement, and scenarios for the important ones |
| 11 | [Risks and technical debt](11-risks-and-technical-debt.md) | What could hurt, and what's known to be untidy |
| 12 | [Glossary](12-glossary.md) | Points to `GLOSSARY.md` |

Diagrams are Mermaid code blocks.

## About arc42

arc42, the template for documentation of software and system architecture. Template Version 9.1-EN (based upon AsciiDoc version), October 2026. Created, maintained and © by Dr. Peter Hruschka, Dr. Gernot Starke and contributors. See <https://arc42.org>.
