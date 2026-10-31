import type { MatchView } from "@n4/server/api";
import { Avatar } from "../../components/Avatar.tsx";
import { Logo } from "../../components/Logo.tsx";
import { MatchOver } from "../../components/MatchOver.tsx";
import { PlayerCards } from "../../components/PlayerCards.tsx";
import { dartLabel } from "../../lib/darts.ts";
import { legsLabel, rulesLabel } from "../../lib/labels.ts";
import { useStation } from "../../lib/useStation.ts";

/** The bar's small capitals: the match label and "501 · Best of 3 · Leg 2". */
const SMALL = "whitespace-nowrap font-pixel text-muted text-pu-14 uppercase";
/** "Free", "Connecting…" */
const NOTE = "m-auto text-center font-pixel text-muted text-pu-40 uppercase tracking-pu-4";
const TOTAL_LABEL = "font-pixel text-pu-13 uppercase tracking-[1px]";

/** A station's scoreboard for a TV or the projector: live, with nothing to press. */
export function WatchPage({ id }: { id: number }) {
  const { view, connected } = useStation(id, { watch: true });
  const match = view?.match;

  return (
    <main className="flex h-screen flex-col overflow-hidden text-pu-24 [--px:calc(min(100vw,177.78vh)/1280)]">
      <header className="flex h-pu-64 items-center justify-between gap-pu-20 border-0 border-border border-b border-solid px-pu-32">
        <div className="flex min-w-0 items-center gap-pu-20">
          <Logo width="3em" />
          <span className="whitespace-nowrap font-pixel text-accent text-pu-20 uppercase tracking-pu-2">
            {view?.name ?? `Station ${id}`}
          </span>
          {match?.label && <span className={`${SMALL} tracking-pu-2`}>· {match.label}</span>}
        </div>
        {!connected ? (
          <span className="status status-danger min-h-pu-36! px-pu-14! text-pu-13!">
            Server offline
          </span>
        ) : (
          match && match.state.phase !== "notStarted" && <MatchLine match={match} />
        )}
      </header>
      {!view ? (
        <p className={NOTE}>Connecting…</p>
      ) : !match ? (
        <p className={NOTE}>{view.notice ?? "Free"}</p>
      ) : match.state.phase === "notStarted" ? (
        <NextMatch match={match} />
      ) : match.state.phase === "matchWon" ? (
        <MatchOver match={match} size="projector" />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-pu-16 px-pu-32 pt-pu-20 pb-pu-24">
          <PlayerCards match={match} size="projector" />
          <WatchVisit match={match} />
        </div>
      )}
    </main>
  );
}

/** "501 · Best of 3 · Leg 2" */
function MatchLine({ match }: { match: MatchView }) {
  const { settings, state } = match;
  return (
    <span className={`${SMALL} tracking-pu-1`}>
      {settings.startScore} · {legsLabel(settings.legsToWin)}
      {settings.legsToWin > 1 && (
        <>
          {" "}
          · Leg <span className="text-text">{state.legs.length}</span>
        </>
      )}
    </span>
  );
}

function NextMatch({ match }: { match: MatchView }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-pu-40 p-pu-32">
      <span className="font-pixel text-muted text-pu-22 uppercase tracking-pu-6">Next</span>
      <div className="avatar-pu-160 flex flex-wrap items-center justify-center gap-pu-32">
        {match.players.map((p, i) => (
          <div key={p.id} className="flex items-center gap-pu-56">
            {i > 0 && (
              <span className="font-pixel text-accent text-pu-28 uppercase tracking-pu-4">vs</span>
            )}
            <div className="flex flex-col items-center gap-pu-18 font-bold font-pixel text-pu-40 uppercase tracking-pu-4">
              <Avatar player={p} large />
              <span>{p.name}</span>
            </div>
          </div>
        ))}
      </div>
      <span className="font-pixel text-muted text-pu-15 uppercase tracking-pu-2">
        {rulesLabel(match.settings)} · {legsLabel(match.settings.legsToWin)} · Waiting to start
      </span>
    </div>
  );
}

/** The visit in one row: who, three darts, the total. */
function WatchVisit({ match }: { match: MatchView }) {
  const { state, players } = match;
  const visit = state.currentVisit;
  const thrower = players[visit?.player ?? state.currentPlayer]?.name ?? "?";
  const total = visit?.bust ? 0 : (visit?.darts.reduce((sum, d) => sum + d.score, 0) ?? 0);
  // The next dart's slot blinks a cursor while the thrower is at the board.
  const next = state.phase === "throwing" ? (visit?.darts.length ?? 0) : -1;
  return (
    <section
      className={`flex h-pu-132 items-center gap-pu-16 border-solid px-pu-20 ${visit?.bust ? "border-danger border-pu-3 bg-danger-tint" : "border border-border bg-panel"}`}
      aria-label="Current visit"
    >
      <span className="w-pu-120 font-pixel text-muted text-pu-14 uppercase leading-[1.6] tracking-[1px]">
        Visit
        <br />
        <span className="text-accent">{thrower}</span>
      </span>
      <div className="grid flex-1 grid-cols-3 gap-pu-12">
        {[0, 1, 2].map((i) => {
          const dart = visit?.darts[i];
          return (
            <span
              key={dart?.dartId ?? `slot-${i}`}
              className={`flex h-pu-92 items-center justify-center border text-pu-72 ${dart ? (dart.ignored ? "border-faint border-dashed bg-transparent text-muted line-through" : "border-border border-solid bg-surface") : i === next ? "border-accent border-dashed bg-transparent text-accent" : "border-line-soft border-dashed bg-transparent"}`}
            >
              {dart ? dartLabel(dart.segment) : i === next ? "_" : ""}
            </span>
          );
        })}
      </div>
      <div className="flex w-pu-220 flex-col items-end gap-pu-6">
        <span className={`${TOTAL_LABEL} text-muted`}>{visit?.bust ? "" : "Total"}</span>
        <span
          className={
            visit?.bust
              ? "font-bold font-pixel text-danger text-pu-32 uppercase tracking-pu-3"
              : "text-pu-64 leading-[0.8]"
          }
        >
          {visit?.bust ? "Bust" : String(total).padStart(3, "0")}
        </span>
        <span className={`${TOTAL_LABEL} text-accent`}>
          {state.phase === "awaitingTakeout" ? "Remove darts" : `${thrower} to throw`}
        </span>
      </div>
    </section>
  );
}
