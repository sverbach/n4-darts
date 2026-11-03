import { dartStats, matchState } from "@n4/engine";
import type { Db, MatchRecord } from "../db.ts";
import type { Result } from "./plan/types.ts";

/** A decided tournament match as the pure logic sees it. */
export function resultOf(match: MatchRecord, events: ReturnType<Db["events"]>): Result | null {
  if (!match.closedAt || match.abandoned || !match.winner || !match.slot) return null;
  const [a, b] = match.playerIds as [string, string];
  if (match.walkover) {
    const legs = match.settings.legsToWin;
    return {
      slot: match.slot,
      players: [a, b],
      winner: match.winner,
      legs: match.winner === a ? [legs, 0] : [0, legs],
      walkover: true,
      stats: [
        { points: 0, darts: 0 },
        { points: 0, darts: 0 },
      ],
    };
  }
  const state = matchState(match.settings, events);
  const stats = dartStats(match.settings, events);
  return {
    slot: match.slot,
    players: [a, b],
    winner: match.winner,
    legs: [state.players[0]?.legsWon ?? 0, state.players[1]?.legsWon ?? 0],
    walkover: false,
    stats: [stats[0] ?? { points: 0, darts: 0 }, stats[1] ?? { points: 0, darts: 0 }],
  };
}
