import {
  type BermudaTarget,
  type MatchEvent,
  type PlayerIndex,
  type Segment,
  started,
  type VisitView,
} from "./events.ts";
import {
  notStarted,
  type PartyState,
  playRounds,
  type RoundsState,
  roundsNotStarted,
} from "./party.ts";

export const BERMUDA_RULES = 1;

export type BermudaOrder = "classic" | "shuffled";

export const OUTER_BULL_ROUND = 25;
export const BULL_ROUND = 50;
export const CLASSIC: readonly BermudaTarget[] = [
  12,
  13,
  14,
  "double",
  15,
  16,
  17,
  "treble",
  18,
  19,
  20,
  OUTER_BULL_ROUND,
  BULL_ROUND,
];
export const BERMUDA_ROUNDS = CLASSIC.length;

export interface BermudaSettings {
  mode: "bermuda";
  order: BermudaOrder;
  rulesVersion: number;
}

export const defaultBermudaSettings: BermudaSettings = {
  mode: "bermuda",
  order: "classic",
  rulesVersion: BERMUDA_RULES,
};

export interface BermudaRound {
  scored: number;
  halved: boolean;
}

export interface BermudaPlayer {
  total: number;
  /** Per round: what the visit scored and whether it halved the total, or null until it's over. */
  rounds: (BermudaRound | null)[];
}

export interface BermudaState extends PartyState, RoundsState {
  mode: "bermuda";
  players: BermudaPlayer[];
  targets: BermudaTarget[];
}

/** The round's target; sudden death is at the outer bull. */
export const bermudaTarget = (round: number, targets: readonly BermudaTarget[]): BermudaTarget =>
  targets[round - 1] ?? OUTER_BULL_ROUND;

export function drawBermudaTargets(random = Math.random): BermudaTarget[] {
  const targets = [...CLASSIC];
  for (let i = targets.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [targets[i], targets[j]] = [targets[j] as BermudaTarget, targets[i] as BermudaTarget];
  }
  return targets;
}

function checkTargets(targets: BermudaTarget[] | undefined): BermudaTarget[] {
  const valid =
    targets?.length === CLASSIC.length &&
    new Set(targets).size === targets.length &&
    targets.every((t) => CLASSIC.includes(t));
  if (!valid) throw new Error("a shuffled Bermuda match needs each of the 13 targets once");
  return targets;
}

/** Whether a dart hits the target. The bullseye is a double, so it counts in the doubles round. */
export function hitsTarget(segment: Segment, target: BermudaTarget): boolean {
  if (segment.multiplier === 0) return false;
  if (target === "double") return segment.multiplier === 2;
  if (target === "treble") return segment.multiplier === 3;
  if (target === OUTER_BULL_ROUND) return segment.number === 25;
  if (target === BULL_ROUND) return segment.number === 25 && segment.multiplier === 2;
  return segment.number === target;
}

export function bermudaState(settings: BermudaSettings, events: MatchEvent[]): BermudaState {
  if (settings.rulesVersion !== BERMUDA_RULES) {
    throw new Error(`unknown Bermuda rules version ${settings.rulesVersion}`);
  }
  const match = started(events);
  if (!match) {
    return { mode: "bermuda", ...notStarted, ...roundsNotStarted, players: [], targets: [] };
  }
  const targets = settings.order === "shuffled" ? checkTargets(match.targets) : [...CLASSIC];

  const players: BermudaPlayer[] = Array.from({ length: match.playerCount }, () => ({
    total: 0,
    rounds: [],
  }));
  const party = playRounds(match.visits, match.playerCount, BERMUDA_ROUNDS, {
    visit(raw, player, round) {
      const thrower = players[player] as BermudaPlayer;
      const target = bermudaTarget(round, targets);
      const view: VisitView = { player, darts: [], bust: false, checkout: false };
      for (const { dartId, segment } of raw.darts) {
        if (view.darts.length >= 3) {
          view.darts.push({ dartId, segment, score: 0, ignored: true });
          continue;
        }
        const score = hitsTarget(segment, target) ? segment.number * segment.multiplier : 0;
        view.darts.push({ dartId, segment, score, ignored: false });
      }
      const over = view.darts.length >= 3;
      const scored = view.darts.reduce((sum, d) => sum + d.score, 0);
      // Sudden death only adds the bulls: halving both leaders can't separate them.
      const halved = scored === 0 && round <= BERMUDA_ROUNDS;
      // A visit in progress shows its hits so far; it can only halve once it's over.
      const done = over || raw.closed;
      thrower.rounds[round - 1] = done || scored > 0 ? { scored, halved: done && halved } : null;
      thrower.total = thrower.rounds.reduce<number>((total, r) => {
        if (!r) return total;
        return r.halved ? Math.floor(total / 2) : total + r.scored;
      }, 0);
      return { view, over };
    },
    leaders(contenders) {
      const best = Math.max(...contenders.map((p) => players[p]?.total ?? 0));
      return contenders.filter((p: PlayerIndex) => players[p]?.total === best);
    },
  });
  return { mode: "bermuda", ...party, players, targets };
}
