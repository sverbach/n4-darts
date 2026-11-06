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
