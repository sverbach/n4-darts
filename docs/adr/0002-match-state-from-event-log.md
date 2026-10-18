# Match state is rebuilt from an append-only event log in SQLite

Every dart, correction and admin action in a match is appended to that match's event log; scores, turns and results are always derived by folding the log through pure game rules, never stored as mutable state. This gives crash recovery (server restart mid-match), an audit trail for self-service corrections, and the raw material for long-term player stats. SQLite in a Docker volume is enough for two boards and keeps the deployment to one container.

## Consequences

- A correction never edits a dart; it appends a `DartCorrected` event and the original detection stays visible.
- Changing game rules changes the results of replayed old matches unless the rules are versioned per match.
