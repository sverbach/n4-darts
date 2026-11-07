import { type MatchEvent, type PlayerIndex, started, type VisitView } from "./events.ts";
import {
  notStarted,
  type PartyState,
  playRounds,
  type RoundsState,
  roundsNotStarted,
} from "./party.ts";

export const CRICKET_RULES = 1;
export const CRICKET_ROUNDS = 50;
export const CRICKET_TARGETS = [20, 19, 18, 17, 16, 15, 25] as const;
export const CLOSED = 3;

export type CricketVariant = "standard" | "cutThroat";

export interface CricketSettings {
  mode: "cricket";
  variant: CricketVariant;
  rulesVersion: number;
}

export const defaultCricketSettings: CricketSettings = {
  mode: "cricket",
  variant: "standard",
  rulesVersion: CRICKET_RULES,
};

export interface CricketPlayer {
  marks: Record<number, number>;
  points: number;
}

export interface CricketState extends PartyState, RoundsState {
  mode: "cricket";
  players: CricketPlayer[];
}

const isTarget = (n: number) => (CRICKET_TARGETS as readonly number[]).includes(n);

export const closedBy = (player: CricketPlayer | undefined, target: number) =>
  (player?.marks[target] ?? 0) >= CLOSED;

export function cricketState(settings: CricketSettings, events: MatchEvent[]): CricketState {
  if (settings.rulesVersion !== CRICKET_RULES) {
    throw new Error(`unknown Cricket rules version ${settings.rulesVersion}`);
  }
  const match = started(events);
  if (!match) return { mode: "cricket", ...notStarted, ...roundsNotStarted, players: [] };

  const cutThroat = settings.variant === "cutThroat";
  const players: CricketPlayer[] = Array.from({ length: match.playerCount }, () => ({
    marks: Object.fromEntries(CRICKET_TARGETS.map((t) => [t, 0])),
    points: 0,
  }));
  const others = (p: PlayerIndex) => players.filter((_, i) => i !== p);
  const closedAll = (p: CricketPlayer) => CRICKET_TARGETS.every((t) => closedBy(p, t));
  const marksOf = (p: CricketPlayer) =>
    CRICKET_TARGETS.reduce((sum, t) => sum + Math.min(CLOSED, p.marks[t] ?? 0), 0);
  const ahead = (p: CricketPlayer, q: CricketPlayer) =>
    cutThroat ? p.points <= q.points : p.points >= q.points;
  let bullRound = 0;
  let bulls = new Map<PlayerIndex, number>();
  let winner: PlayerIndex | null = null;

  const party = playRounds(match.visits, match.playerCount, CRICKET_ROUNDS, {
    visit(raw, player, round) {
      const thrower = players[player] as CricketPlayer;
      const suddenDeath = round > CRICKET_ROUNDS;
      if (suddenDeath && bullRound !== round) {
        bullRound = round;
        bulls = new Map();
      }
      const view: VisitView = { player, darts: [], bust: false, checkout: false };
      for (const { dartId, segment } of raw.darts) {
        if (winner !== null || view.darts.length >= 3) {
          view.darts.push({ dartId, segment, score: 0, ignored: true });
          continue;
        }
        const target = segment.number;
        const hits = isTarget(target) ? segment.multiplier : 0;
        if (suddenDeath) {
          const marks = target === 25 ? hits : 0;
          bulls.set(player, (bulls.get(player) ?? 0) + marks);
          view.darts.push({ dartId, segment, score: marks, ignored: false });
          continue;
        }
        if (!hits) {
          view.darts.push({ dartId, segment, score: 0, ignored: false });
          continue;
        }
        const before = thrower.marks[target] ?? 0;
        const extra = Math.max(0, before + hits - CLOSED) - Math.max(0, before - CLOSED);
        thrower.marks[target] = before + hits;
        const open = others(player).filter((p) => !closedBy(p, target));
        if (extra > 0 && open.length > 0) {
          const points = extra * target;
          if (cutThroat) for (const p of open) p.points += points;
          else thrower.points += points;
        }
        view.darts.push({ dartId, segment, score: hits, ignored: false });
        if (closedAll(thrower) && others(player).every((p) => ahead(thrower, p))) {
          winner = player;
        }
      }
      return { view, over: winner !== null || view.darts.length >= 3 };
    },
    leaders(contenders) {
      if (bullRound > CRICKET_ROUNDS) {
        const best = Math.max(...contenders.map((p) => bulls.get(p) ?? 0));
        return contenders.filter((p) => (bulls.get(p) ?? 0) === best);
      }
      const points = contenders.map((p) => players[p]?.points ?? 0);
      const bestPoints = cutThroat ? Math.min(...points) : Math.max(...points);
      const level = contenders.filter((p) => players[p]?.points === bestPoints);
      const bestMarks = Math.max(...level.map((p) => marksOf(players[p] as CricketPlayer)));
      return level.filter((p) => marksOf(players[p] as CricketPlayer) === bestMarks);
    },
    winner: () => winner,
  });
  return { mode: "cricket", ...party, players };
}
