import type { Phase, PlayerIndex, RawVisit, VisitView } from "./events.ts";

export interface PartyState {
  phase: Phase;
  currentPlayer: PlayerIndex;
  currentVisit: VisitView | null;
  visits: VisitView[];
  upNext: PlayerIndex;
  winner: PlayerIndex | null;
}

export interface PartyRules {
  visit(raw: RawVisit, player: PlayerIndex): { view: VisitView; over: boolean };
  winner(): PlayerIndex | null;
  next(player: PlayerIndex): PlayerIndex;
}

export const notStarted: PartyState = {
  phase: "notStarted",
  currentPlayer: 0,
  currentVisit: null,
  visits: [],
  upNext: 0,
  winner: null,
};

export function playParty(raws: RawVisit[], rules: PartyRules): PartyState {
  let currentPlayer: PlayerIndex = 0;
  let currentVisit: VisitView | null = null;
  let over = false;
  const visits: VisitView[] = [];
  for (const raw of raws) {
    const visit = rules.visit(raw, currentPlayer);
    over = visit.over;
    if (!raw.closed) {
      currentVisit = visit.view;
      continue;
    }
    visits.push(visit.view);
    currentVisit = null;
    over = false;
    if (rules.winner() !== null) break;
    currentPlayer = rules.next(currentPlayer);
  }
  const winner = rules.winner();
  const phase: Phase = winner !== null ? "matchWon" : over ? "awaitingTakeout" : "throwing";
  return {
    phase,
    currentPlayer,
    currentVisit,
    visits,
    upNext: rules.next(currentPlayer),
    winner,
  };
}

export interface RoundsState {
  round: number;
  suddenDeath: boolean;
  contenders: PlayerIndex[];
}

export interface RoundsRules {
  visit(raw: RawVisit, player: PlayerIndex, round: number): { view: VisitView; over: boolean };
  leaders(contenders: PlayerIndex[]): PlayerIndex[];
}

export const roundsNotStarted: RoundsState = { round: 1, suddenDeath: false, contenders: [] };

export function playRounds(
  raws: RawVisit[],
  playerCount: number,
  rounds: number,
  rules: RoundsRules,
): PartyState & RoundsState {
  let contenders: PlayerIndex[] = Array.from({ length: playerCount }, (_, i) => i);
  let round = 1;
  let suddenDeath = false;
  let position = 0;
  let finished = false;
  let winner: PlayerIndex | null = null;

  const endRound = () => {
    position = 0;
    if (round < rounds) {
      round += 1;
      return;
    }
    const leaders = rules.leaders(contenders);
    if (leaders.length === 1) {
      winner = leaders[0] as PlayerIndex;
      return;
    }
    contenders = leaders;
    suddenDeath = true;
    round += 1;
  };

  const party = playParty(raws, {
    visit(raw, player) {
      const { view, over } = rules.visit(raw, player, round);
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
  return { ...party, round, suddenDeath, contenders };
}
