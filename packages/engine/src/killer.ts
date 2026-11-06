import { type MatchEvent, type PlayerIndex, started, type VisitView } from "./events.ts";
import { notStarted, type PartyState, playParty } from "./party.ts";

export const KILLER_RULES = 1;
export const MAX_LIVES = 9;
export const CHARGED = 3;

export interface KillerSettings {
  mode: "killer";
  lives: number;
  rulesVersion: number;
}

export const defaultKillerSettings: KillerSettings = {
  mode: "killer",
  lives: 3,
  rulesVersion: KILLER_RULES,
};

export interface KillerPlayer {
  number: number;
  charge: number;
  killer: boolean;
  lives: number;
}

export interface KillerState extends PartyState {
  mode: "killer";
  players: KillerPlayer[];
}

export function drawKillerNumbers(playerCount: number, random = Math.random): number[] {
  const numbers = Array.from({ length: 20 }, (_, i) => i + 1);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j] as number, numbers[i] as number];
  }
  return numbers.slice(0, playerCount);
}

function checkNumbers(numbers: number[] | undefined, count: number): number[] {
  const valid =
    numbers?.length === count &&
    new Set(numbers).size === count &&
    numbers.every((n) => Number.isInteger(n) && n >= 1 && n <= 20);
  if (!valid) throw new Error("a Killer match needs a distinct number from 1 to 20 per player");
  return numbers;
}

export function killerState(settings: KillerSettings, events: MatchEvent[]): KillerState {
  if (settings.rulesVersion !== KILLER_RULES) {
    throw new Error(`unknown Killer rules version ${settings.rulesVersion}`);
  }
  const match = started(events);
  if (!match) return { mode: "killer", ...notStarted, players: [] };

  const count = match.playerCount;
  const players: KillerPlayer[] = checkNumbers(match.numbers, count).map((number) => ({
    number,
    charge: 0,
    killer: false,
    lives: settings.lives,
  }));
  const alive = () => players.flatMap((p, i) => (p.lives > 0 ? [i] : []));
  let winner: PlayerIndex | null = null;

  const party = playParty(match.visits, {
    visit(raw, player) {
      const thrower = players[player] as KillerPlayer;
      const view: VisitView = { player, darts: [], bust: false, checkout: false };
      for (const { dartId, segment } of raw.darts) {
        if (winner !== null || thrower.lives === 0 || view.darts.length >= 3) {
          view.darts.push({ dartId, segment, score: 0, ignored: true });
          continue;
        }
        let effect = 0;
        const owner = players.findIndex((p) => p.number === segment.number && p.lives > 0);
        if (owner === player && !thrower.killer && segment.multiplier > 0) {
          thrower.charge = Math.min(CHARGED, thrower.charge + segment.multiplier);
          thrower.killer = thrower.charge === CHARGED;
          effect = 1;
        } else if (owner >= 0 && thrower.killer && segment.multiplier === 2) {
          (players[owner] as KillerPlayer).lives -= 1;
          effect = 1;
          const left = alive();
          if (left.length === 1) winner = left[0] as PlayerIndex;
        }
        view.darts.push({ dartId, segment, score: effect, ignored: false });
      }
      const over = winner !== null || thrower.lives === 0 || view.darts.length >= 3;
      return { view, over };
    },
    winner: () => winner,
    next(player) {
      for (let step = 1; step <= count; step++) {
        const candidate = (player + step) % count;
        if ((players[candidate]?.lives ?? 0) > 0) return candidate;
      }
      return player;
    },
  });
  return { mode: "killer", ...party, players };
}
