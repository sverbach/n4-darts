import { checkoutRoute } from "./checkout.ts";
import { type MatchEvent, type PlayerIndex, started, type VisitView } from "./events.ts";
import {
  notStarted,
  type PartyState,
  playRounds,
  type RoundsState,
  roundsNotStarted,
} from "./party.ts";
import { isBust, type OutRule } from "./x01.ts";

export const RANDOM_CHECKOUT_RULES = 1;
export const RANDOM_CHECKOUT_DIFFICULTIES = ["beginner", "medium", "hard", "mixed"] as const;
/** Numbers drawn beyond the rounds, for sudden death; after those it starts over. */
export const SUDDEN_DEATH_DRAWS = 20;

export type RandomCheckoutDifficulty = (typeof RANDOM_CHECKOUT_DIFFICULTIES)[number];

export const DIFFICULTY: Record<
  RandomCheckoutDifficulty,
  { from: number; to: number; outRule: OutRule }
> = {
  beginner: { from: 2, to: 40, outRule: "straight" },
  medium: { from: 41, to: 100, outRule: "double" },
  hard: { from: 101, to: 170, outRule: "double" },
  mixed: { from: 2, to: 170, outRule: "double" },
};

export interface RandomCheckoutSettings {
  mode: "randomCheckout";
  difficulty: RandomCheckoutDifficulty;
  rounds: number;
  rulesVersion: number;
}

export const defaultRandomCheckoutSettings: RandomCheckoutSettings = {
  mode: "randomCheckout",
  difficulty: "beginner",
  rounds: 10,
  rulesVersion: RANDOM_CHECKOUT_RULES,
};

export interface RandomCheckoutPlayer {
  points: number;
  /** Per round: checked out, missed, or not thrown (yet). */
  results: (boolean | null)[];
}

export interface RandomCheckoutState extends PartyState, RoundsState {
  mode: "randomCheckout";
  players: RandomCheckoutPlayer[];
  checkouts: number[];
  /** The round's number. */
  target: number;
  /** What the thrower has left of it in the visit in progress. */
  remaining: number;
}

/** The numbers a difficulty draws from: its range, each finishable in three darts. */
export function checkoutPool(difficulty: RandomCheckoutDifficulty): number[] {
  const { from, to, outRule } = DIFFICULTY[difficulty];
  return Array.from({ length: to - from + 1 }, (_, i) => from + i).filter(
    (n) => checkoutRoute(n, 3, outRule) !== null,
  );
}

/** A number per round and some for sudden death, each pool shuffled before it repeats. */
export function drawCheckouts(
  difficulty: RandomCheckoutDifficulty,
  rounds: number,
  random = Math.random,
): number[] {
  const pool = checkoutPool(difficulty);
  const drawn: number[] = [];
  while (drawn.length < rounds + SUDDEN_DEATH_DRAWS) {
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j] as number, shuffled[i] as number];
    }
    drawn.push(...shuffled);
  }
  return drawn.slice(0, rounds + SUDDEN_DEATH_DRAWS);
}

export const roundCheckout = (round: number, checkouts: readonly number[]) =>
  checkouts[(round - 1) % checkouts.length] as number;

function checkCheckouts(checkouts: number[] | undefined, settings: RandomCheckoutSettings) {
  const pool = checkoutPool(settings.difficulty);
  const valid =
    checkouts !== undefined &&
    checkouts.length >= settings.rounds &&
    checkouts.every((n) => pool.includes(n));
  if (!valid) {
    throw new Error(`a Random Checkout match needs a ${settings.difficulty} number per round`);
  }
  return checkouts;
}

export function randomCheckoutState(
  settings: RandomCheckoutSettings,
  events: MatchEvent[],
): RandomCheckoutState {
  if (settings.rulesVersion !== RANDOM_CHECKOUT_RULES) {
    throw new Error(`unknown Random Checkout rules version ${settings.rulesVersion}`);
  }
  const match = started(events);
  if (!match) {
    return {
      mode: "randomCheckout",
      ...notStarted,
      ...roundsNotStarted,
      players: [],
      checkouts: [],
      target: 0,
      remaining: 0,
    };
  }
  const checkouts = checkCheckouts(match.checkouts, settings);
  const { outRule } = DIFFICULTY[settings.difficulty];

  const players: RandomCheckoutPlayer[] = Array.from({ length: match.playerCount }, () => ({
    points: 0,
    results: [],
  }));
  let remaining = roundCheckout(1, checkouts);
  const party = playRounds(match.visits, match.playerCount, settings.rounds, {
    visit(raw, player, round) {
      const thrower = players[player] as RandomCheckoutPlayer;
      const target = roundCheckout(round, checkouts);
      const view: VisitView = { player, darts: [], bust: false, checkout: false };
      let left = target;
      let over = false;
      for (const { dartId, segment } of raw.darts) {
        if (over) {
          view.darts.push({ dartId, segment, score: 0, ignored: true });
          continue;
        }
        const score = segment.number * segment.multiplier;
        view.darts.push({ dartId, segment, score, ignored: false });
        left -= score;
        if (isBust(left, segment, outRule)) {
          view.bust = true;
          left = target;
        } else if (left === 0) {
          view.checkout = true;
          thrower.points += 1;
        }
        over = view.bust || view.checkout || view.darts.length === 3;
      }
      thrower.results[round - 1] = view.checkout ? true : over || raw.closed ? false : null;
      remaining = left;
      return { view, over };
    },
    leaders(contenders) {
      const best = Math.max(...contenders.map((p) => players[p]?.points ?? 0));
      return contenders.filter((p: PlayerIndex) => players[p]?.points === best);
    },
  });
  const target = roundCheckout(party.round, checkouts);
  return {
    mode: "randomCheckout",
    ...party,
    players,
    checkouts,
    target,
    remaining: party.currentVisit ? remaining : target,
  };
}
