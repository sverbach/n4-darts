import {
  type DartView,
  type InRule,
  MAX_PLAYERS,
  MIN_PLAYERS,
  type OutRule,
  type PlayerIndex,
} from "@n4/engine";
import type { MatchView, Player, StationCommand } from "@n4/server/api";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { dartLabel } from "./darts.ts";
import { SegmentPicker } from "./SegmentPicker.tsx";
import { useStation } from "./useStation.ts";

type Send = (command: StationCommand) => Promise<string | null>;

export function StationPage({ id }: { id: number }) {
  const { view, connected, send } = useStation(id);
  const [error, setError] = useState<string | null>(null);

  const run: Send = async (command) => {
    const message = await send(command);
    setError(message);
    return message;
  };

  return (
    <main className="station">
      <header className="station-bar">
        <span className="station-name">Station {id}</span>
        <span className={`status ${connected && view?.boardOnline ? "ok" : "warn"}`}>
          {!connected ? "Server offline" : view?.boardOnline ? "Board online" : "Board offline"}
        </span>
      </header>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!view ? (
        <p className="hint">Connecting…</p>
      ) : !view.match ? (
        <QuickMatch send={run} />
      ) : view.match.state.phase === "notStarted" ? (
        <Lineup match={view.match} send={run} />
      ) : (
        <Match match={view.match} send={run} />
      )}
    </main>
  );
}

/** Pick players from the list (or add one), choose settings, then go to the lineup. */
function QuickMatch({ send }: { send: Send }) {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [startScore, setStartScore] = useState(301);
  const [inRule, setInRule] = useState<InRule>("straight");
  const [outRule, setOutRule] = useState<OutRule>("straight");
  const [legsToWin, setLegsToWin] = useState(1);

  const load = useCallback(async () => {
    const res = await fetch("/api/players").catch(() => null);
    if (res?.ok) setPlayers(await res.json());
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (playerId: string) =>
    setPicked((current) =>
      current.includes(playerId)
        ? current.filter((p) => p !== playerId)
        : current.length < MAX_PLAYERS
          ? [...current, playerId]
          : current,
    );

  const addPlayer = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newName }),
    }).catch(() => null);
    if (!res) return setAddError("Server not reachable");
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return setAddError((body as { error?: string }).error ?? "Couldn't add player");
    setAddError(null);
    setNewName("");
    await load();
    toggle((body as Player).id);
  };

  const submit = () =>
    send({
      type: "quickMatch",
      playerIds: picked,
      settings: { startScore, inRule, outRule, legsToWin },
    });

  return (
    <div className="new-match">
      <h1>New match</h1>
      <p className="hint left">
        Pick {MIN_PLAYERS}–{MAX_PLAYERS} players. You can change the order next.
      </p>
      {!players ? (
        <p className="hint">Loading players…</p>
      ) : (
        <div className="player-picker">
          {players.length === 0 && <p className="hint left">No players yet: add the first one.</p>}
          {players.map((p) => {
            const position = picked.indexOf(p.id);
            return (
              <button
                type="button"
                key={p.id}
                aria-pressed={position >= 0}
                onClick={() => toggle(p.id)}
                disabled={position < 0 && picked.length >= MAX_PLAYERS}
              >
                {position >= 0 && <span className="pick-number">{position + 1}</span>}
                {p.name}
              </button>
            );
          })}
        </div>
      )}
      <form className="inline-form" onSubmit={addPlayer}>
        <input
          aria-label="New player"
          placeholder="New player"
          value={newName}
          required
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      {addError && (
        <p className="error" role="alert">
          {addError}
        </p>
      )}
      <div className="settings">
        <label>
          Start
          <select value={startScore} onChange={(e) => setStartScore(Number(e.target.value))}>
            {[301, 501, 701].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          In
          <select value={inRule} onChange={(e) => setInRule(e.target.value as InRule)}>
            <option value="straight">Single</option>
            <option value="double">Double</option>
            <option value="master">Master</option>
            <option value="bull">Bull</option>
          </select>
        </label>
        <label>
          Out
          <select value={outRule} onChange={(e) => setOutRule(e.target.value as OutRule)}>
            <option value="straight">Single</option>
            <option value="double">Double</option>
            <option value="master">Master</option>
          </select>
        </label>
        <label>
          First to
          <select value={legsToWin} onChange={(e) => setLegsToWin(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "leg" : "legs"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="button"
        className="primary"
        disabled={picked.length < MIN_PLAYERS}
        onClick={submit}
      >
        Continue
      </button>
    </div>
  );
}

/** A match set up but not started: settle the throwing order, then start. */
function Lineup({ match, send }: { match: MatchView; send: Send }) {
  const ids = match.players.map((p) => p.id);
  const setOrder = (playerIds: string[]) => send({ type: "setOrder", playerIds });
  const move = (from: number, to: number) => {
    const next = [...ids];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved as string);
    void setOrder(next);
  };
  const shuffle = () => {
    const next = [...ids];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j] as string, next[i] as string];
    }
    void setOrder(next);
  };
  const { startScore, legsToWin } = match.settings;

  return (
    <div className="lineup">
      <h1>
        {match.players.length === 2 ? match.players.map((p) => p.name).join(" vs ") : "Next match"}
      </h1>
      <p className="hint left">
        {startScore}, first to {legsToWin} {legsToWin === 1 ? "leg" : "legs"}. Top of the list
        throws first.
      </p>
      <ol className="lineup-list">
        {match.players.map((p, i) => (
          <li key={p.id}>
            <span className="lineup-position">{i + 1}</span>
            <span className="lineup-name">{p.name}</span>
            <button
              type="button"
              aria-label={`Move ${p.name} up`}
              disabled={i === 0}
              onClick={() => move(i, i - 1)}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`Move ${p.name} down`}
              disabled={i === match.players.length - 1}
              onClick={() => move(i, i + 1)}
            >
              ↓
            </button>
          </li>
        ))}
      </ol>
      <div className="controls">
        <button type="button" onClick={shuffle}>
          Shuffle
        </button>
        <button type="button" className="primary" onClick={() => send({ type: "startMatch" })}>
          Start
        </button>
      </div>
      <button
        type="button"
        className="ghost end-match"
        onClick={() => send({ type: "abandonMatch" })}
      >
        Cancel
      </button>
    </div>
  );
}

function Match({ match, send }: { match: MatchView; send: Send }) {
  const { state, players, settings } = match;
  const [correcting, setCorrecting] = useState<DartView | null>(null);
  const leg = state.legs.at(-1);
  const visit = state.currentVisit;
  const visitTotal = visit?.bust ? 0 : (visit?.darts.reduce((sum, d) => sum + d.score, 0) ?? 0);
  const nameOf = (player: PlayerIndex) => players[player]?.name ?? "?";

  const lastVisitOf = (player: PlayerIndex) => {
    const last = leg?.visits.findLast((v) => v.player === player);
    if (!last) return null;
    return last.bust ? "Bust" : String(last.darts.reduce((sum, d) => sum + d.score, 0));
  };

  if (state.phase === "matchWon" && state.winner !== null) {
    return (
      <section className="match-over">
        <p className="game-shot">Game shot</p>
        <h1>{nameOf(state.winner)} wins</h1>
        {settings.legsToWin > 1 && (
          <p className="legs-result">
            {players.length === 2
              ? state.players.map((p) => p.legsWon).join(" – ")
              : `${state.players[state.winner]?.legsWon} legs`}
          </p>
        )}
        <div className="controls">
          <button type="button" onClick={() => send({ type: "undo" })}>
            Undo
          </button>
          <button type="button" className="primary" onClick={() => send({ type: "closeMatch" })}>
            Done
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="match">
      <div className={`scoreboard ${players.length > 2 ? "many" : ""}`}>
        {state.players.map((player, p) => (
          <div
            key={players[p]?.id ?? p}
            className={`player ${state.currentPlayer === p ? "active" : ""}`}
          >
            <div className="player-name">{nameOf(p)}</div>
            <div className="remaining">{player.remaining}</div>
            <div className="player-meta">
              {settings.legsToWin > 1 && <span>Legs {player.legsWon}</span>}
              {!player.isIn && <span>Not in</span>}
              {lastVisitOf(p) && <span>Last {lastVisitOf(p)}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className={`visit ${visit?.bust ? "bust" : ""}`}>
        <div className="darts">
          {[0, 1, 2].map((i) => {
            const dart = visit?.darts[i];
            return dart ? (
              <button
                type="button"
                key={dart.dartId}
                className={`dart ${dart.ignored ? "ignored" : ""}`}
                onClick={() => setCorrecting(dart)}
                aria-label={`Correct dart ${i + 1}: ${dartLabel(dart.segment)}`}
              >
                {dartLabel(dart.segment)}
              </button>
            ) : (
              <span key={`empty-${i}`} className="dart empty" />
            );
          })}
        </div>
        <div className="visit-total">{visit ? (visit.bust ? "Bust" : visitTotal) : ""}</div>
        {state.phase === "awaitingTakeout" ? (
          <p className="prompt">Remove darts</p>
        ) : (
          <p className="hint">{nameOf(state.currentPlayer)} to throw</p>
        )}
        {visit && <p className="hint">Tap a dart to correct it</p>}
      </div>

      <div className="controls">
        <button type="button" onClick={() => send({ type: "undo" })}>
          Undo
        </button>
        <button type="button" className="primary" onClick={() => send({ type: "nextPlayer" })}>
          Next player
        </button>
      </div>
      <button
        type="button"
        className="ghost end-match"
        onClick={() => {
          if (confirm("End this match without a result?")) void send({ type: "abandonMatch" });
        }}
      >
        End match
      </button>

      {correcting && (
        <SegmentPicker
          title={`Correct ${dartLabel(correcting.segment)}`}
          onCancel={() => setCorrecting(null)}
          onPick={(segment) => {
            setCorrecting(null);
            void send({ type: "correctDart", dartId: correcting.dartId, segment });
          }}
        />
      )}
    </section>
  );
}
