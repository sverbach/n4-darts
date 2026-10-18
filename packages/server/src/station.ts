// A station: one board, at most one open match, and everyone watching it (GLOSSARY.md).
// Board events and station commands become events in the match's log; the match state is
// always derived from that log (docs/adr/0002).

import { randomUUID } from "node:crypto";
import {
  defaultX01Settings,
  MAX_PLAYERS,
  MIN_PLAYERS,
  matchState,
  RULES_VERSION,
  type Segment,
} from "@n4/engine";
import type { MatchSettingsInput, StationCommand, StationView } from "./api.ts";
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
  /** Corrects a dart of the station's match; `admin` when the organiser does it from /admin. */
  correct(dartId: string, segment: Segment, source: "station" | "admin"): StationView;
  /** Puts a new match on the station, not yet started; throws if the station is busy. */
  assign(match: { playerIds: string[]; settings?: MatchSettingsInput | undefined }): StationView;
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
      name: db.getStationConfig(id)?.name ?? `Station ${id}`,
      boardOnline,
      match:
        match && current
          ? {
              id: match.id,
              players: match.playerIds.map((playerId) => ({
                id: playerId,
                name: db.getPlayer(playerId)?.name ?? "?",
              })),
              settings: match.settings,
              state: current,
            }
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
    // Keep the recorded result in step with the log: a win can be undone or corrected away.
    const winner = state()?.winner ?? null;
    const winnerId = winner === null ? null : (match.playerIds[winner] ?? null);
    if (winnerId !== match.winner) {
      db.setWinner(match.id, winnerId);
      match.winner = winnerId;
    }
  }

  /** Checks a list of players for a match; throws a CommandError if it can't be played. */
  function checkPlayers(playerIds: string[]) {
    if (playerIds.length < MIN_PLAYERS || playerIds.length > MAX_PLAYERS) {
      throw new CommandError(`a match needs ${MIN_PLAYERS}–${MAX_PLAYERS} players`);
    }
    if (new Set(playerIds).size !== playerIds.length) {
      throw new CommandError("a player can only be in a match once");
    }
    for (const playerId of playerIds) {
      const player = db.getPlayer(playerId);
      if (!player) throw new CommandError("no such player");
      if (player.archived) throw new CommandError(`${player.name} is archived`);
    }
  }

  function assign(input: { playerIds: string[]; settings?: MatchSettingsInput | undefined }) {
    if (match) throw new CommandError("station already has a match; close it first");
    checkPlayers(input.playerIds);
    const settings = { ...defaultX01Settings, ...input.settings, rulesVersion: RULES_VERSION };
    if (!Number.isInteger(settings.startScore) || settings.startScore < 2) {
      throw new CommandError("start score must be a whole number of at least 2");
    }
    if (!Number.isInteger(settings.legsToWin) || settings.legsToWin < 1) {
      throw new CommandError("legs to win must be a whole number of at least 1");
    }
    const matchId = randomUUID();
    db.createMatch({ id: matchId, station: id, settings, playerIds: [...input.playerIds] });
    match = db.getMatch(matchId) ?? null;
    events = [];
    notify();
    return view();
  }

  function correct(dartId: string, segment: Segment, source: "station" | "admin") {
    if (!match) throw new CommandError("no match on this station");
    append({ type: "DartCorrected", dartId, segment, source });
    notify();
    return view();
  }

  function clearMatch() {
    match = null;
    events = [];
    boardDarts = [];
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

  /** Resets we asked for whose `BoardReset` hasn't come back yet. */
  let ownResets = 0;

  async function resetBoard() {
    boardDarts = [];
    ownResets += 1;
    await board.reset().catch(() => {
      // Board offline: it'll be out of sync until the next takeout; nothing better to do here.
      ownResets = Math.max(0, ownResets - 1);
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
        // A reset we sent may never be answered now.
        ownResets = 0;
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
        boardDarts = [];
        if (ownResets > 0) {
          ownResets -= 1;
          return;
        }
        // Pressed on the laptop. The logged darts stand (players-and-matches spec). Mid-visit the
        // visit carries on with the next darts; a finished visit ends here, because the board is
        // clear and won't see a takeout, and the next player's darts must count.
        if (state()?.phase !== "awaitingTakeout") return;
        append({ type: "TakeoutFinished", source: "reset" });
        break;
      default:
        return;
    }
    notify();
  }

  async function command(cmd: StationCommand): Promise<StationView> {
    switch (cmd.type) {
      case "quickMatch":
        return assign({ playerIds: cmd.playerIds, settings: cmd.settings });
      case "setOrder": {
        if (!match || state()?.phase !== "notStarted") {
          throw new CommandError("the order can only change before the match starts");
        }
        const same =
          cmd.playerIds.length === match.playerIds.length &&
          [...cmd.playerIds].sort().join() === [...match.playerIds].sort().join();
        if (!same) throw new CommandError("the order has to contain the match's players");
        db.setOrder(match.id, cmd.playerIds);
        match.playerIds = [...cmd.playerIds];
        break;
      }
      case "startMatch":
        if (!match) throw new CommandError("no match on this station");
        if (state()?.phase !== "notStarted")
          throw new CommandError("the match has already started");
        // Clear the board first, so leftover darts can't count for the new match.
        await resetBoard();
        append({ type: "MatchStarted", playerCount: match.playerIds.length });
        break;
      case "correctDart":
        return correct(cmd.dartId, cmd.segment, "station");
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
        if (!match) break;
        if (match.winner === null) {
          throw new CommandError("the match isn't won yet; abandon it to end it without a result");
        }
        db.closeMatch(match.id);
        clearMatch();
        break;
      case "abandonMatch":
        if (!match) break;
        if (state()?.phase === "notStarted") db.deleteMatch(match.id);
        else db.closeMatch(match.id, { abandoned: true });
        clearMatch();
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
    correct,
    assign,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
