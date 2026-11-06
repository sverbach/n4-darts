import { type MatchEvent, type PlayerIndex, started, type VisitView } from "./events.ts";
import { notStarted, type PartyState, playParty } from "./party.ts";

export const AROUND_THE_CLOCK_RULES = 1;

export interface AroundTheClockSettings {
  mode: "aroundTheClock";
  rulesVersion: number;
}

export const defaultAroundTheClockSettings: AroundTheClockSettings = {
  mode: "aroundTheClock",
  rulesVersion: AROUND_THE_CLOCK_RULES,
};

export const BULL = 25;

export interface AroundTheClockPlayer {
  target: number | null;
}

export interface AroundTheClockState extends PartyState {
  mode: "aroundTheClock";
  players: AroundTheClockPlayer[];
}

const after = (target: number) => (target === 20 ? BULL : target === BULL ? null : target + 1);

export function aroundTheClockState(
  settings: AroundTheClockSettings,
  events: MatchEvent[],
): AroundTheClockState {
  if (settings.rulesVersion !== AROUND_THE_CLOCK_RULES) {
    throw new Error(`unknown Around the Clock rules version ${settings.rulesVersion}`);
  }
  const match = started(events);
  if (!match) return { mode: "aroundTheClock", ...notStarted, players: [] };

  const count = match.playerCount;
  const players: AroundTheClockPlayer[] = Array.from({ length: count }, () => ({ target: 1 }));
  let winner: PlayerIndex | null = null;
  const party = playParty(match.visits, {
    visit(raw, player) {
      const thrower = players[player] as AroundTheClockPlayer;
      const view: VisitView = { player, darts: [], bust: false, checkout: false };
      for (const { dartId, segment } of raw.darts) {
        if (winner !== null || view.darts.length >= 3) {
          view.darts.push({ dartId, segment, score: 0, ignored: true });
          continue;
        }
        const hit = segment.multiplier > 0 && segment.number === thrower.target;
        if (hit && thrower.target !== null) {
          thrower.target = after(thrower.target);
          if (thrower.target === null) winner = player;
        }
        view.darts.push({ dartId, segment, score: hit ? 1 : 0, ignored: false });
      }
      return { view, over: winner !== null || view.darts.length >= 3 };
    },
    winner: () => winner,
    next: (player) => (player + 1) % count,
  });
  return { mode: "aroundTheClock", ...party, players };
}
