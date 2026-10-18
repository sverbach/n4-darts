import type { DartView, InRule, OutRule, PlayerIndex } from "@n4/engine";
import type { MatchView, StationCommand } from "@n4/server/api";
import { type FormEvent, useState } from "react";
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
      ) : view.match ? (
        <Match match={view.match} send={run} />
      ) : (
        <NewMatch send={run} />
      )}
    </main>
  );
}

function NewMatch({ send }: { send: Send }) {
  const [players, setPlayers] = useState<[string, string]>(["", ""]);
  const [firstPlayer, setFirstPlayer] = useState<PlayerIndex>(0);
  const [startScore, setStartScore] = useState(301);
  const [inRule, setInRule] = useState<InRule>("straight");
  const [outRule, setOutRule] = useState<OutRule>("straight");
  const [legsToWin, setLegsToWin] = useState(1);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void send({
      type: "startMatch",
      players,
      firstPlayer,
      settings: { startScore, inRule, outRule, legsToWin },
    });
  };

  return (
    <form className="new-match" onSubmit={submit}>
      <h1>New match</h1>
      {([0, 1] as const).map((i) => (
        <div className="player-input" key={i}>
          <input
            aria-label={`Player ${i + 1}`}
            placeholder={`Player ${i + 1}`}
            value={players[i]}
            required
            onChange={(e) => {
              const next: [string, string] = [...players];
              next[i] = e.target.value;
              setPlayers(next);
            }}
          />
          <button
            type="button"
            className="throws-first"
            aria-pressed={firstPlayer === i}
            onClick={() => setFirstPlayer(i)}
          >
            {firstPlayer === i ? "Throws first" : "Throw first"}
          </button>
        </div>
      ))}
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
      <button type="submit" className="primary">
        Start match
      </button>
    </form>
  );
}

function Match({ match, send }: { match: MatchView; send: Send }) {
  const { state, players, settings } = match;
  const [correcting, setCorrecting] = useState<DartView | null>(null);
  const leg = state.legs.at(-1);
  const visit = state.currentVisit;
  const visitTotal = visit?.bust ? 0 : (visit?.darts.reduce((sum, d) => sum + d.score, 0) ?? 0);

  const lastVisitOf = (player: PlayerIndex) => {
    const last = leg?.visits.findLast((v) => v.player === player);
    if (!last) return null;
    return last.bust ? "Bust" : String(last.darts.reduce((sum, d) => sum + d.score, 0));
  };

  if (state.phase === "matchWon" && state.winner !== null) {
    return (
      <section className="match-over">
        <p className="game-shot">Game shot</p>
        <h1>{players[state.winner]} wins</h1>
        {settings.legsToWin > 1 && (
          <p className="legs-result">
            {state.players[0].legsWon} – {state.players[1].legsWon}
          </p>
        )}
        <div className="controls">
          <button type="button" onClick={() => send({ type: "undo" })}>
            Undo
          </button>
          <button type="button" className="primary" onClick={() => send({ type: "closeMatch" })}>
            New match
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="match">
      <div className="scoreboard">
        {([0, 1] as const).map((p) => (
          <div key={p} className={`player ${state.currentPlayer === p ? "active" : ""}`}>
            <div className="player-name">{players[p]}</div>
            <div className="remaining">{state.players[p].remaining}</div>
            <div className="player-meta">
              {settings.legsToWin > 1 && <span>Legs {state.players[p].legsWon}</span>}
              {!state.players[p].isIn && <span>Not in</span>}
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
          <p className="hint">{players[state.currentPlayer]} to throw</p>
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
          if (confirm("End this match without a result?")) void send({ type: "closeMatch" });
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
