import { type MatchEvent, type Segment, started, type VisitView } from "./events.ts";
import {
  notStarted,
  type PartyState,
  playRounds,
  type RoundsState,
  roundsNotStarted,
} from "./party.ts";

export const GOLF_RULES = 1;
export const GOLF_HOLES = [9, 18] as const;
export const MISSED_HOLE = 5;

export interface GolfSettings {
  mode: "golf";
  holes: (typeof GOLF_HOLES)[number];
  rulesVersion: number;
}

export const defaultGolfSettings: GolfSettings = {
  mode: "golf",
  holes: 9,
  rulesVersion: GOLF_RULES,
};

export interface GolfPlayer {
  holes: (number | null)[];
  total: number;
}

export interface GolfState extends PartyState, RoundsState {
  mode: "golf";
  players: GolfPlayer[];
}

const COURSE = [...Array.from({ length: 20 }, (_, i) => i + 1), 25];

export const holeTarget = (hole: number) => COURSE[(hole - 1) % COURSE.length] as number;

export function strokes(segment: Segment, target: number): number {
  if (segment.multiplier === 0 || segment.number !== target) return MISSED_HOLE;
  if (target === 25) return segment.multiplier === 2 ? 1 : 2;
  return 4 - segment.multiplier;
}

export function golfState(settings: GolfSettings, events: MatchEvent[]): GolfState {
  if (settings.rulesVersion !== GOLF_RULES) {
    throw new Error(`unknown Golf rules version ${settings.rulesVersion}`);
  }
  const match = started(events);
  if (!match) return { mode: "golf", ...notStarted, ...roundsNotStarted, players: [] };

  const players: GolfPlayer[] = Array.from({ length: match.playerCount }, () => ({
    holes: [],
    total: 0,
  }));
  const party = playRounds(match.visits, match.playerCount, settings.holes, {
    visit(raw, player, hole) {
      const golfer = players[player] as GolfPlayer;
      const target = holeTarget(hole);
      const view: VisitView = { player, darts: [], bust: false, checkout: false };
      for (const { dartId, segment } of raw.darts) {
        if (view.darts.length >= 3) {
          view.darts.push({ dartId, segment, score: 0, ignored: true });
          continue;
        }
        view.darts.push({ dartId, segment, score: strokes(segment, target), ignored: false });
      }
      const counted = view.darts.filter((d) => !d.ignored).map((d) => d.score);
      const over = counted.length >= 3;
      const best = counted.length ? Math.min(...counted) : raw.closed ? MISSED_HOLE : null;
      golfer.holes[hole - 1] = best;
      golfer.total = golfer.holes.reduce<number>((sum, h) => sum + (h ?? 0), 0);
      return { view, over };
    },
    leaders(contenders) {
      const best = Math.min(...contenders.map((p) => players[p]?.total ?? 0));
      return contenders.filter((p) => players[p]?.total === best);
    },
  });
  return { mode: "golf", ...party, players };
}
