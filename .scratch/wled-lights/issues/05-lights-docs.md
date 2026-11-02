# Lights in the docs

Status: needs-triage
Type: task
Blocked by: 03, 04

## What to do

- `pnpm dev:sim` also starts a fake WLED; README explains it and the Lights tab.
- Architecture: context (WLED as a neighbour system), building blocks (lights module), runtime (an event to a preset), deployment; ADR 0009 (WLED's JSON API directly, fire-and-forget).
