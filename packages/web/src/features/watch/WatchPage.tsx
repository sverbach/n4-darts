import type { MatchView } from "@n4/server/api";
import { Avatar } from "../../components/Avatar.tsx";
import { CricketGrid } from "../../components/CricketGrid.tsx";
import { TargetBoard } from "../../components/Dartboard.tsx";
import { MatchOver } from "../../components/MatchOver.tsx";
import { hasModePanel, ModePanel } from "../../components/ModePanel.tsx";
import { PlayerCards, PlayerList } from "../../components/PlayerCards.tsx";
import { Scorecard } from "../../components/Scorecard.tsx";
import { SoundButton, SoundPrompt } from "../../components/Sound.tsx";
import { TopBar } from "../../components/TopBar.tsx";
import { dartLabel } from "../../lib/darts.ts";
import { matchRulesLabel } from "../../lib/labels.ts";
import {
  cricketOf,
  golfOf,
  liveLabel,
  targetsOf,
  visitTotalLabel,
  visitValue,
} from "../../lib/modes.ts";
import { useCallouts } from "../../lib/useCallouts.ts";
import { useStation } from "../../lib/useStation.ts";

const SMALL = "whitespace-nowrap font-pixel text-muted text-pu-20 uppercase";
/** "Free", "Connecting…" */
const NOTE = "m-auto text-center font-pixel text-muted text-pu-40 uppercase tracking-pu-4";
const TOTAL_LABEL = "font-pixel text-pu-20 uppercase tracking-[1px]";

/** A station's scoreboard for a TV or the projector: live, with nothing to press. */
export function WatchPage({ id }: { id: number }) {
  const { view, connected } = useStation(id, { watch: true });
  const match = view?.match;
  const sound = useCallouts(match ?? null, { wakeLock: true });

  return (
    <main className="text-pu-24 flex h-screen flex-col overflow-hidden [--px:calc(min(100vw,177.78vh)/1280)]">
      <TopBar
        size="projector"
        className="min-h-pu-64 px-pu-32 flex flex-none flex-col justify-center"
        start={
          <>
            <span className="font-pixel text-pu-20 text-text tracking-pu-2 whitespace-nowrap uppercase">
              {view?.name ?? `Station ${id}`}
            </span>
            {match?.label && <span className={`${SMALL} tracking-pu-2`}>· {match.label}</span>}
          </>
        }
        end={
          !connected ? (
            <span className="status status-danger min-h-pu-36! px-pu-14! text-pu-20!">
              Server offline
            </span>
          ) : (
            match &&
            (match.state.phase === "throwing" || match.state.phase === "awaitingTakeout") && (
              <MatchLine match={match} />
            )
          )
        }
        menu={
          sound.needsTap ? (
            <SoundPrompt className="px-pu-14! min-h-[max(30px,calc(36*var(--px)))]! text-[length:max(11px,calc(20*var(--px)))]!" />
          ) : (
            <SoundButton
              sound={sound}
              className="text-pu-24 size-[max(36px,calc(44*var(--px)))] min-h-0 flex-none"
            />
          )
        }
      />
      {!view ? (
        <p className={NOTE}>Connecting…</p>
      ) : !match ? (
        <p className={NOTE}>{view.notice ?? "Free"}</p>
      ) : match.state.phase === "notStarted" ? (
        <NextMatch match={match} />
      ) : match.state.phase === "matchWon" ? (
        <MatchOver match={match} size="projector" />
      ) : (
        <div className="gap-pu-16 px-pu-32 pt-pu-20 pb-pu-24 flex min-h-0 flex-1 flex-col">
          <WatchBoard match={match} />
          <WatchVisit match={match} />
        </div>
      )}
    </main>
  );
}

function WatchBoard({ match }: { match: MatchView }) {
  const targets = targetsOf(match);
  if (!targets) return <PlayerCards match={match} size="projector" />;
  const golf = golfOf(match);
  const cricket = cricketOf(match);
  const wide = golf || cricket;
  return (
    <div
      className={`gap-pu-24 grid min-h-0 flex-1 ${wide ? "grid-cols-[auto_minmax(0,1fr)]" : "grid-cols-[minmax(0,1fr)_calc(420*var(--px))]"}`}
    >
      {hasModePanel(match) ? (
        // Above the board, so the players keep the whole column beside it.
        <div className="gap-pu-16 flex min-h-0 min-w-0 flex-col">
          <ModePanel match={match} size="projector" />
          <TargetBoard
            highlight={targets.highlight}
            label={targets.label}
            className="min-h-0 w-auto flex-1 self-center"
          />
        </div>
      ) : (
        <TargetBoard
          highlight={targets.highlight}
          label={targets.label}
          className={`justify-self-center ${wide ? "w-[calc(500*var(--px))] self-center" : "h-full max-h-full min-h-0 w-auto"}`}
        />
      )}
      {golf ? (
        <Scorecard state={golf.state} holes={golf.holes} players={match.players} size="projector" />
      ) : cricket ? (
        <CricketGrid state={cricket} players={match.players} size="projector" />
      ) : (
        <PlayerList match={match} size="projector" />
      )}
    </div>
  );
}

function MatchLine({ match }: { match: MatchView }) {
  return <span className={`${SMALL} tracking-pu-1`}>{liveLabel(match)}</span>;
}

function NextMatch({ match }: { match: MatchView }) {
  return (
    <div className="gap-pu-40 p-pu-32 flex flex-1 flex-col items-center justify-center">
      <span className="font-pixel text-muted text-pu-22 tracking-pu-6 uppercase">Next</span>
      <div className="avatar-pu-160 gap-pu-32 flex flex-wrap items-center justify-center">
        {match.players.map((p, i) => (
          <div key={p.id} className="gap-pu-56 flex items-center">
            {i > 0 && (
              <span className="font-pixel text-muted text-pu-28 tracking-pu-4 uppercase">vs</span>
            )}
            <div className="gap-pu-18 font-pixel text-pu-40 tracking-pu-4 flex flex-col items-center font-bold uppercase">
              <Avatar player={p} large />
              <span>{p.name}</span>
            </div>
          </div>
        ))}
      </div>
      <span className="font-pixel text-muted text-pu-20 tracking-pu-2 uppercase">
        {matchRulesLabel(match.settings)} · Waiting to start
      </span>
    </div>
  );
}

/** The visit in one row: who, three darts, the total. */
function WatchVisit({ match }: { match: MatchView }) {
  const { state, players } = match;
  const visit = state.currentVisit;
  const thrower = players[visit?.player ?? state.currentPlayer]?.name ?? "?";
  const total = visit?.bust ? 0 : visitValue(match.settings.mode, visit?.darts ?? []);
  const totalLabel = visitTotalLabel(match.settings.mode);
  // The next dart's slot blinks a cursor while the thrower is at the board.
  const next = state.phase === "throwing" ? (visit?.darts.length ?? 0) : -1;
  return (
    <section
      className={`h-pu-132 gap-pu-16 px-pu-20 flex items-center border-solid ${visit?.bust ? "border-danger border-pu-3 bg-danger-tint" : "border-border bg-panel border"}`}
      aria-label="Current visit"
    >
      <span className="w-pu-120 font-pixel text-muted text-pu-20 leading-[1.6] tracking-[1px] uppercase">
        Visit
      </span>
      <div className="gap-pu-12 grid flex-1 grid-cols-3">
        {[0, 1, 2].map((i) => {
          const dart = visit?.darts[i];
          return (
            <span
              key={dart?.dartId ?? `slot-${i}`}
              className={`h-pu-92 text-pu-72 flex items-center justify-center border ${dart ? (dart.ignored ? "border-faint text-muted border-dashed bg-transparent line-through" : "border-border bg-surface border-solid") : i === next ? "border-accent text-accent border-dashed bg-transparent" : "border-line-soft border-dashed bg-transparent"}`}
            >
              {dart ? dartLabel(dart.segment) : i === next ? "_" : ""}
            </span>
          );
        })}
      </div>
      <div className="w-pu-220 gap-pu-6 flex flex-col items-end">
        <span className={`${TOTAL_LABEL} text-muted`}>
          {visit?.bust || !visit?.darts.length ? "" : totalLabel}
        </span>
        <span
          className={
            visit?.bust
              ? "font-pixel text-danger text-pu-32 tracking-pu-3 font-bold uppercase"
              : "text-pu-64 leading-[0.8]"
          }
        >
          {visit?.bust ? "Bust" : visit?.darts.length ? total : ""}
        </span>
        <span
          className={`${TOTAL_LABEL} ${state.phase === "awaitingTakeout" ? "text-accent" : "text-muted"}`}
        >
          {state.phase === "awaitingTakeout"
            ? "Remove darts"
            : !visit?.darts.length
              ? `${thrower} to throw`
              : ""}
        </span>
      </div>
    </section>
  );
}
