import { type MatchEvent, type PlayerIndex, started, type VisitView } from "./events.ts";
import {
  notStarted,
  type PartyState,
  playRounds,
  type RoundsState,
  roundsNotStarted,
} from "./party.ts";

export const HIGH_SCORE_RULES = 1;
export const MAX_ROUNDS = 20;

export interface HighScoreSettings {
  mode: "highScore";
  rounds: number;
  rulesVersion: number;
}

export const defaultHighScoreSettings: HighScoreSettings = {
  mode: "highScore",
  rounds: 7,
  rulesVersion: HIGH_SCORE_RULES,
};

export interface HighScorePlayer {
  total: number;
}

export interface HighScoreState extends PartyState, RoundsState {
  mode: "highScore";
  players: HighScorePlayer[];
}

export function highScoreState(settings: HighScoreSettings, events: MatchEvent[]): HighScoreState {
  if (settings.rulesVersion !== HIGH_SCORE_RULES) {
    throw new Error(`unknown High Score rules version ${settings.rulesVersion}`);
  }
  const match = started(events);
  if (!match) return { mode: "highScore", ...notStarted, ...roundsNotStarted, players: [] };

  const players: HighScorePlayer[] = Array.from({ length: match.playerCount }, () => ({
    total: 0,
  }));
  const party = playRounds(match.visits, match.playerCount, settings.rounds, {
    visit(raw, player) {
      const thrower = players[player] as HighScorePlayer;
      const view: VisitView = { player, darts: [], bust: false, checkout: false };
      for (const { dartId, segment } of raw.darts) {
        if (view.darts.length >= 3) {
          view.darts.push({ dartId, segment, score: 0, ignored: true });
          continue;
        }
        const score = segment.number * segment.multiplier;
        thrower.total += score;
        view.darts.push({ dartId, segment, score, ignored: false });
      }
      return { view, over: view.darts.length >= 3 };
    },
    leaders(contenders) {
      const best = Math.max(...contenders.map((p) => players[p]?.total ?? 0));
      return contenders.filter((p: PlayerIndex) => players[p]?.total === best);
    },
  });
  return { mode: "highScore", ...party, players };
}
