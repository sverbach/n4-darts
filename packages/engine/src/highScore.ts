import { type MatchEvent, type PlayerIndex, started, type VisitView } from "./events.ts";
import { notStarted, type PartyState, playParty } from "./party.ts";

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

export interface HighScoreState extends PartyState {
  mode: "highScore";
  players: HighScorePlayer[];
  round: number;
  suddenDeath: boolean;
  contenders: PlayerIndex[];
}

export function highScoreState(settings: HighScoreSettings, events: MatchEvent[]): HighScoreState {
  if (settings.rulesVersion !== HIGH_SCORE_RULES) {
    throw new Error(`unknown High Score rules version ${settings.rulesVersion}`);
  }
  const match = started(events);
  if (!match) {
    return {
      mode: "highScore",
      ...notStarted,
      players: [],
      round: 1,
      suddenDeath: false,
      contenders: [],
    };
  }

  const count = match.playerCount;
  const players: HighScorePlayer[] = Array.from({ length: count }, () => ({ total: 0 }));
  let contenders: PlayerIndex[] = players.map((_, i) => i);
  let round = 1;
  let suddenDeath = false;
  let position = 0;
  let finished = false;
  let winner: PlayerIndex | null = null;

  const endRound = () => {
    position = 0;
    if (round < settings.rounds) {
      round += 1;
      return;
    }
    const best = Math.max(...contenders.map((p) => players[p]?.total ?? 0));
    const leaders = contenders.filter((p) => players[p]?.total === best);
    if (leaders.length === 1) {
      winner = leaders[0] as PlayerIndex;
      return;
    }
    contenders = leaders;
    suddenDeath = true;
    round += 1;
  };

  const party = playParty(match.visits, {
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
      const over = view.darts.length >= 3;
      finished = over || raw.closed;
      if (finished) {
        position += 1;
        if (position >= contenders.length) endRound();
      }
      return { view, over: over || winner !== null };
    },
    winner: () => winner,
    next: () => {
      const after = finished ? position : (position + 1) % contenders.length;
      finished = false;
      return contenders[after] as PlayerIndex;
    },
  });
  return { mode: "highScore", ...party, players, round, suddenDeath, contenders };
}
