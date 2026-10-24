import {
  type DartView,
  MAX_PLAYERS,
  MIN_PLAYERS,
  type PlayerIndex,
  type X01Settings,
} from "@n4/engine";
import type { MatchView, StationCommand } from "@n4/server/api";
import { Fragment, type ReactNode, useState } from "react";
import { Avatar } from "./Avatar.tsx";
import { BoardMenu, type MatchAction } from "./BoardMenu.tsx";
import { dartLabel } from "./darts.ts";
import { Logo } from "./Logo.tsx";
import {
  defaultSetupSettings,
  legsLabel,
  PlayerPicker,
  SettingsFields,
  type SetupSettings,
} from "./MatchSetup.tsx";
import { PixelIcon } from "./PixelIcon.tsx";
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

  const match = view?.match ?? null;
  return (
    <main className="station">
      <header className="station-bar">
        <div className="station-id">
          <Logo width="86px" className="wide-only" />
          <span className="station-name">{view?.name ?? `Station ${id}`}</span>
        </div>
        <BoardMenu
          stationId={id}
          online={view?.boardOnline ?? false}
          running={view?.boardRunning ?? true}
          connected={connected}
          matchAction={match ? matchAction(match, run) : undefined}
        />
      </header>
      {match && <SettingsStrip match={match} />}
      <div className="station-body">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {!view ? (
          <p className="hint">Connecting…</p>
        ) : !match ? (
          <QuickMatch send={run} notice={view.notice} />
        ) : match.state.phase === "notStarted" ? (
          <Lineup match={match} send={run} />
        ) : (
          <Match match={match} send={run} />
        )}
      </div>
    </main>
  );
}

/** Ending the match, from the board menu; a tournament match is only held or sent back from /admin. */
function matchAction(match: MatchView, send: Send): MatchAction | undefined {
  const phase = match.state.phase;
  if (phase === "notStarted") {
    if (match.label) return undefined;
    return { label: "Cancel match", run: () => void send({ type: "abandonMatch" }) };
  }
  if (phase === "matchWon") return undefined;
  const question = match.label
    ? "End this match? It goes back in the queue and is played again."
    : "End this match without a result?";
  return {
    label: "End match",
    note: match.label ? "Goes back in the queue" : undefined,
    run: () => {
      if (confirm(question)) void send({ type: "abandonMatch" });
    },
  };
}

const IN_RULES = { straight: "", double: "Double in", master: "Master in", bull: "Bull in" };
const OUT_RULES = { straight: "Single out", double: "Double out", master: "Master out" };

/** "501 · Double in · Double out". */
export function rulesLabel(settings: X01Settings) {
  return [settings.startScore, IN_RULES[settings.inRule], OUT_RULES[settings.outRule]]
    .filter(Boolean)
    .join(" · ");
}

/** The match label, rules, legs and which leg: "Group A … 501 · Double out · Best of 3 · Leg 2". */
function SettingsStrip({ match }: { match: MatchView }) {
  const { settings, state, label } = match;
  const legs = legsLabel(settings.legsToWin);
  const leg = settings.legsToWin > 1 && state.legs.length > 0 ? ` · Leg ${state.legs.length}` : "";
  return (
    <div className="settings-strip label">
      {label ? (
        <>
          <span className="settings-strip-label">{label}</span>
          <span>
            {rulesLabel(settings)} · {legs}
            {leg}
          </span>
        </>
      ) : (
        <>
          <span>{rulesLabel(settings)}</span>
          <span>
            {legs}
            {leg}
          </span>
        </>
      )}
    </div>
  );
}

/** Pick players from the list (or add one), choose settings, then go to the lineup. */
function QuickMatch({ send, notice }: { send: Send; notice: string | null }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [settings, setSettings] = useState<SetupSettings>(defaultSetupSettings);

  return (
    <div className="quick-match">
      {notice && <p className="notice">{notice}</p>}
      <section className="quick-match-players">
        <div>
          <h1>New match</h1>
          <p className="hint">
            Pick {MIN_PLAYERS}–{MAX_PLAYERS} players. You can change the order next.
          </p>
        </div>
        <PlayerPicker title="Players" picked={picked} onChange={setPicked} />
      </section>
      <section className="quick-match-settings">
        <span className="label">Match settings</span>
        <SettingsFields value={settings} onChange={setSettings} playerCount={picked.length} />
        <button
          type="button"
          className="primary cta"
          disabled={picked.length < MIN_PLAYERS}
          onClick={() => send({ type: "quickMatch", playerIds: picked, settings })}
        >
          Continue <PixelIcon name="arrow" height="0.9em" />
        </button>
      </section>
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
      <div className="lineup-head">
        {match.label && <span className="match-label">{match.label}</span>}
        <h1>
          {match.players.length === 2
            ? match.players.map((p) => p.name).join(" vs ")
            : "Next match"}
        </h1>
        <p className="hint">
          {startScore}, {legsLabel(legsToWin).toLowerCase()}. Top of the list throws first.
        </p>
      </div>
      <ol className="lineup-list">
        {match.players.map((p, i) => (
          <li key={p.id}>
            <span className="lineup-position">{String(i + 1).padStart(2, "0")}</span>
            <Avatar player={p} />
            <span className="lineup-name">{p.name}</span>
            <button
              type="button"
              aria-label={`Move ${p.name} up`}
              disabled={i === 0}
              onClick={() => move(i, i - 1)}
            >
              <PixelIcon name="up" />
            </button>
            <button
              type="button"
              aria-label={`Move ${p.name} down`}
              disabled={i === match.players.length - 1}
              onClick={() => move(i, i + 1)}
            >
              <PixelIcon name="down" />
            </button>
          </li>
        ))}
      </ol>
      <div className="controls">
        <button type="button" onClick={shuffle}>
          Shuffle
        </button>
        <button type="button" className="primary cta" onClick={() => send({ type: "startMatch" })}>
          Start <PixelIcon name="arrow" height="0.9em" />
        </button>
      </div>
    </div>
  );
}

/** Who throws after the current visit: the next player, or the next leg's starter after a checkout. */
function upNext(match: MatchView): PlayerIndex {
  const { state, players } = match;
  const leg = state.legs.at(-1);
  const after = state.currentVisit?.checkout && leg ? leg.starter : state.currentPlayer;
  return (after + 1) % players.length;
}

function Match({ match, send }: { match: MatchView; send: Send }) {
  const [correcting, setCorrecting] = useState<DartView | null>(null);
  const [adding, setAdding] = useState(false);

  if (match.state.phase === "matchWon") {
    return (
      <MatchOver match={match}>
        <div className="controls">
          <button type="button" onClick={() => send({ type: "undo" })}>
            Undo
          </button>
          <button
            type="button"
            className="primary cta"
            onClick={() => send({ type: "closeMatch" })}
          >
            Done <PixelIcon name="arrow" height="0.9em" />
          </button>
        </div>
      </MatchOver>
    );
  }

  const visit = match.state.currentVisit;
  const dartIndex = correcting ? (visit?.darts.indexOf(correcting) ?? -1) : -1;
  const thrower = match.players[visit?.player ?? match.state.currentPlayer];
  return (
    <section className="match">
      <Scoreboard match={match} onDart={setCorrecting} onAdd={() => setAdding(true)} />

      <div className="match-actions">
        <button
          type="button"
          className="primary cta next-player"
          onClick={() => send({ type: "nextPlayer" })}
        >
          <span>
            Next player <PixelIcon name="arrow" height="0.9em" />
          </span>
          <span className="next-player-up">Up: {match.players[upNext(match)]?.name}</span>
        </button>
        <button type="button" onClick={() => send({ type: "undo" })}>
          Undo
        </button>
      </div>

      {correcting && (
        <SegmentPicker
          title={`Correct ${dartLabel(correcting.segment)}`}
          context={[thrower?.name, dartIndex >= 0 ? `Dart ${dartIndex + 1}` : null]
            .filter(Boolean)
            .join(" · ")}
          current={correcting.segment}
          onCancel={() => setCorrecting(null)}
          onPick={(segment) => {
            setCorrecting(null);
            void send({ type: "correctDart", dartId: correcting.dartId, segment });
          }}
        />
      )}
      {adding && (
        <SegmentPicker
          title={`Add dart ${(visit?.darts.length ?? 0) + 1}`}
          context={[thrower?.name, "Missed by the board"].filter(Boolean).join(" · ")}
          onCancel={() => setAdding(false)}
          onPick={(segment) => {
            setAdding(false);
            void send({ type: "addDart", segment });
          }}
        />
      )}
    </section>
  );
}

/** "Game shot", the winner and the legs; `children` go below (the station's buttons). */
export function MatchOver({ match, children }: { match: MatchView; children?: ReactNode }) {
  const { state, players, settings } = match;
  const winner = state.winner ?? 0;
  const winnerPlayer = players[winner];
  return (
    <section className="match-over">
      <h1 className="game-shot">Game shot</h1>
      <div className="match-over-result">
        {winnerPlayer && (
          <span className="avatar-frame">
            <Avatar player={winnerPlayer} large />
          </span>
        )}
        <div className="match-over-text">
          <p className="match-over-winner">{winnerPlayer?.name ?? "?"} wins</p>
          {settings.legsToWin > 1 &&
            (players.length === 2 ? (
              <div className="legs-result">
                {state.players.map((p, i) => (
                  <Fragment key={players[i]?.id ?? i}>
                    {i > 0 && <span className="legs-dash">–</span>}
                    <div className={i === winner ? "won" : ""}>
                      <span className="legs-number">{p.legsWon}</span>
                      <span className="label">{players[i]?.name}</span>
                    </div>
                  </Fragment>
                ))}
              </div>
            ) : (
              <p className="label">{state.players[winner]?.legsWon} legs</p>
            ))}
        </div>
      </div>
      {children}
    </section>
  );
}

interface ScoreboardProps {
  match: MatchView;
  /** Darts can be tapped to correct them. */
  onDart?: (dart: DartView) => void;
  /** The next empty slot can be tapped to add a dart the board missed. */
  onAdd?: () => void;
}

/** Scores, the current visit and whose turn it is. */
export function Scoreboard(props: ScoreboardProps) {
  return (
    <>
      <PlayerCards match={props.match} />
      <VisitPanel {...props} />
    </>
  );
}

/** A card per player: avatar, name, what's left, legs and last visit; the thrower's framed. */
export function PlayerCards({ match }: { match: MatchView }) {
  const { state, players, settings } = match;
  const leg = state.legs.at(-1);
  const nameOf = (player: PlayerIndex) => players[player]?.name ?? "?";

  const lastVisitOf = (player: PlayerIndex) => {
    const last = leg?.visits.findLast((v) => v.player === player);
    if (!last) return null;
    return last.bust ? "Bust" : String(last.darts.reduce((sum, d) => sum + d.score, 0));
  };

  return (
    <div className={`scoreboard ${players.length > 2 ? "many" : ""}`}>
      {state.players.map((player, p) => {
        const active = state.currentPlayer === p;
        const last = lastVisitOf(p);
        return (
          <div key={players[p]?.id ?? p} className={`player ${active ? "active" : ""}`}>
            {active && (
              <span className="throwing">
                <PixelIcon name="caret" /> Throwing
              </span>
            )}
            {players[p] && <Avatar player={players[p]} large />}
            <div className="player-name">{nameOf(p)}</div>
            <div className="remaining">{player.remaining}</div>
            <div className="player-meta">
              {!player.isIn ? (
                <span className="not-in">Not in</span>
              ) : (
                [settings.legsToWin > 1 && `Legs ${player.legsWon}`, last && `Last ${last}`]
                  .filter(Boolean)
                  .join(" · ")
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** The visit in progress: three dart tiles, the total or bust, and what happens next. */
function VisitPanel(props: ScoreboardProps) {
  const { match, onDart, onAdd } = props;
  const { state, players } = match;
  const visit = state.currentVisit;
  const visitTotal = visit?.bust ? 0 : (visit?.darts.reduce((sum, d) => sum + d.score, 0) ?? 0);
  const nameOf = (player: PlayerIndex) => players[player]?.name ?? "?";
  // The dart that broke the visit, shown in red.
  const bustDart = visit?.bust ? visit.darts.findLast((d) => !d.ignored) : undefined;

  return (
    <section className={`visit ${visit?.bust ? "bust" : ""}`} aria-label="Current visit">
      <div className="visit-head label">
        <span>
          Visit · {nameOf(visit?.player ?? state.currentPlayer)}
          {visit && onDart && <span className="wide-only"> · Tap a dart to correct it</span>}
        </span>
        {visit?.bust ? (
          <span className="visit-bust">Bust</span>
        ) : (
          <span>
            Total <span className="visit-total">{visit ? visitTotal : ""}</span>
          </span>
        )}
      </div>
      <div className="darts">
        {[0, 1, 2].map((i) => {
          const dart = visit?.darts[i];
          if (!dart && onAdd && state.phase === "throwing" && i === (visit?.darts.length ?? 0)) {
            return (
              <button
                type="button"
                key={`add-${i}`}
                className="dart add"
                onClick={onAdd}
                aria-label={`Add dart ${i + 1}`}
              >
                <span className="dart-index label">D{i + 1}</span>
                <span className="dart-add label">+ Add</span>
              </button>
            );
          }
          if (!dart) return <span key={`empty-${i}`} className="dart empty" />;
          const className = `dart ${dart.ignored ? "ignored" : ""} ${dart === bustDart ? "busted" : ""}`;
          const content = (
            <>
              <span className="dart-index label">{dart.ignored ? "Ignored" : `D${i + 1}`}</span>
              <span className="dart-label">{dartLabel(dart.segment)}</span>
            </>
          );
          return onDart ? (
            <button
              type="button"
              key={dart.dartId}
              className={className}
              onClick={() => onDart(dart)}
              aria-label={`Correct dart ${i + 1}: ${dartLabel(dart.segment)}`}
            >
              {content}
            </button>
          ) : (
            <span key={dart.dartId} className={className}>
              {content}
            </span>
          );
        })}
      </div>
      {state.phase === "awaitingTakeout" ? (
        <p className="visit-status" role="status">
          Remove darts
        </p>
      ) : (
        <p className="visit-status waiting">{nameOf(state.currentPlayer)} to throw</p>
      )}
      {visit && onDart && <p className="label narrow-only">Tap a dart to correct it</p>}
    </section>
  );
}
