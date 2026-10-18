// A station: one board, at most one open match, and everyone watching it (GLOSSARY.md).
// Board events and station commands become events in the match's log; the match state is
// always derived from that log (docs/adr/0002).

import { randomUUID } from "node:crypto";
import { defaultX01Settings, matchState } from "@n4/engine";
import type { StationCommand, StationView } from "./api.ts";
import {
  type BoardEvent,
  type BoardThrow,
  type DetectedDart,
  toDetectedDart,
} from "./board/gateway.ts";
import type { Db, StoredEvent } from "./db.ts";

export type { StationCommand, StationView };

/** The part of the board gateway a station needs to send commands. */
export interface BoardControl {
  reset(): Promise<void>;
}

export class CommandError extends Error {}

export interface Station {
  readonly id: number;
  view(): StationView;
  handleBoardEvent(event: BoardEvent): void;
  command(command: StationCommand): Promise<StationView>;
  subscribe(listener: (view: StationView) => void): () => void;
}

export function createStation(options: { id: number; db: Db; board: BoardControl }): Station {
  const { id, db, board } = options;
  const listeners = new Set<(view: StationView) => void>();

  let match = db.openMatchOn(id) ?? null;
  let events: StoredEvent[] = match ? db.events(match.id) : [];
  let boardOnline = false;
  /** Whether the board's darts have been matched against the log since this process started. */
  let synced = false;
  /** Dart ids of the darts currently on the board, by the board's index (0–2). */
  let boardDarts: string[] = [];

  const state = () => (match ? matchState(match.settings, events) : null);

  function view(): StationView {
    const current = state();
    return {
      id,
      boardOnline,
      match:
        match && current
          ? { id: match.id, players: match.players, settings: match.settings, state: current }
          : null,
    };
  }

  function notify() {
    const current = view();
    for (const listener of listeners) listener(current);
  }

  function append(event: StoredEvent) {
    if (!match) return;
    db.append(match.id, event);
    events.push(event);
  }

  /** Darts count while a match is being played; strays are ignored (docs/architecture.md). */
  function acceptingDarts() {
    const phase = state()?.phase;
    return phase === "throwing" || phase === "awaitingTakeout";
  }

  function recordDart({ index, segment, name, coords, bouncer }: DetectedDart) {
    const dartId = randomUUID();
    boardDarts[index] = dartId;
    append({ type: "DartThrown", dartId, segment, name, coords, bouncer });
  }

  /**
   * After a server restart the log and the board may disagree: darts may have been thrown, or
   * pulled, while nobody was listening. Brings the log in line with what's on the board.
   */
  function syncWithBoard(throws: BoardThrow[]) {
    synced = true;
    if (!acceptingDarts()) return;
    const logged = state()?.currentVisit?.darts ?? [];
    // A board dart is a logged one if it sits at exactly the recorded coordinates.
    const coordsOf = new Map(
      events.flatMap((e) =>
        e.type === "DartThrown" ? [[e.dartId, e.coords as BoardThrow["coords"]] as const] : [],
      ),
    );
    const stillOnBoard = logged.every((dart, i) => {
      const recorded = coordsOf.get(dart.dartId);
      const now = throws[i]?.coords;
      return recorded && now && recorded.x === now.x && recorded.y === now.y;
    });
    if (!stillOnBoard) {
      // The logged visit's darts were pulled while we were away.
      append({ type: "TakeoutFinished" });
      for (const [i, t] of throws.entries()) recordDart(toDetectedDart(i, t));
      return;
    }
    boardDarts = logged.map((d) => d.dartId);
    for (let i = logged.length; i < throws.length; i++) {
      recordDart(toDetectedDart(i, throws[i] as BoardThrow));
    }
  }

  async function resetBoard() {
    boardDarts = [];
    await board.reset().catch(() => {
      // Board offline: it'll be out of sync until the next takeout; nothing better to do here.
    });
  }

  function handleBoardEvent(event: BoardEvent) {
    switch (event.type) {
      case "BoardOnline":
        boardOnline = true;
        if (!synced) syncWithBoard(event.snapshot.throws ?? []);
        break;
      case "BoardOffline":
        boardOnline = false;
        break;
      case "DartDetected":
        if (!acceptingDarts()) return;
        recordDart(event);
        break;
      case "DartRevised": {
        const dartId = boardDarts[event.index];
        if (!dartId || !acceptingDarts()) return;
        append({ type: "DartCorrected", dartId, segment: event.segment, source: "board" });
        break;
      }
      case "TakeoutFinished": {
        boardDarts = [];
        const current = state();
        // Also close the winning visit, so it lands in the leg history.
        if (acceptingDarts() || (current?.phase === "matchWon" && current.currentVisit)) {
          append({ type: "TakeoutFinished" });
        }
        break;
      }
      case "BoardReset":
        // Someone (us, or a click on the laptop) cleared the board's darts.
        boardDarts = [];
        return;
      default:
        return;
    }
    notify();
  }

  async function command(cmd: StationCommand): Promise<StationView> {
    switch (cmd.type) {
      case "startMatch": {
        if (match) throw new CommandError("station already has a match; close it first");
        const [a, b] = cmd.players.map((p) => p.trim());
        if (!a || !b) throw new CommandError("both players need a name");
        // Clear the board first, so leftover darts can't count for the new match.
        await resetBoard();
        match = {
          id: randomUUID(),
          station: id,
          settings: { ...defaultX01Settings, ...cmd.settings },
          players: [a, b],
          closedAt: null,
        };
        db.createMatch(match);
        events = [];
        append({ type: "MatchStarted", firstPlayer: cmd.firstPlayer });
        break;
      }
      case "correctDart":
        if (!match) throw new CommandError("no match on this station");
        append({
          type: "DartCorrected",
          dartId: cmd.dartId,
          segment: cmd.segment,
          source: "station",
        });
        break;
      case "nextPlayer":
        if (!match) throw new CommandError("no match on this station");
        append({ type: "VisitEndedManually" });
        await resetBoard();
        break;
      case "undo":
        if (!match) throw new CommandError("no match on this station");
        append({ type: "VisitUndone" });
        // The undone darts may still be on the board; make it forget them so pulling them
        // doesn't end the visit.
        await resetBoard();
        break;
      case "closeMatch":
        if (match) db.closeMatch(match.id);
        match = null;
        events = [];
        boardDarts = [];
        break;
    }
    notify();
    return view();
  }

  return {
    id,
    view,
    handleBoardEvent,
    command,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
