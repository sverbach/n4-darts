import { type DartView, MIN_PLAYERS, type PlayerIndex, upNext } from "@n4/engine";
import type { MatchView, StationCommand } from "@n4/server/api";
import { useState } from "react";
import { Avatar } from "../../components/Avatar.tsx";
import { BoardMenu, type MatchAction } from "../../components/BoardMenu.tsx";
import { CheckoutPanel } from "../../components/CheckoutPanel.tsx";
import { CricketGrid } from "../../components/CricketGrid.tsx";
import { TargetBoard } from "../../components/Dartboard.tsx";
import { Logo } from "../../components/Logo.tsx";
import { MatchOver } from "../../components/MatchOver.tsx";
import { PixelIcon } from "../../components/PixelIcon.tsx";
import { PlayerCards, PlayerList } from "../../components/PlayerCards.tsx";
import { PlayerPicker } from "../../components/PlayerPicker.tsx";
import { Scorecard } from "../../components/Scorecard.tsx";
import { SegmentPicker } from "../../components/SegmentPicker.tsx";
import { SoundPrompt } from "../../components/Sound.tsx";
import { ThemeStar } from "../../components/ThemeStar.tsx";
import { dartLabel } from "../../lib/darts.ts";
import {
  checkoutOf,
  cricketOf,
  golfOf,
  liveLabel,
  targetsOf,
  visitTotalLabel,
  visitValue,
} from "../../lib/modes.ts";
import { useCallouts } from "../../lib/useCallouts.ts";
import { useStation } from "../../lib/useStation.ts";
import {
  defaultSetupSettings,
  SettingsFields,
  type SetupSettings,
  settingsInput,
} from "./MatchSetup.tsx";

type Send = (command: StationCommand) => Promise<string | null>;

/** Every screen's bottom buttons: secondary on the left, the slanted primary twice as wide. */
const CONTROLS = "mt-auto grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2 kiosk:gap-3";
const SECONDARY = "kiosk:min-h-20 kiosk:text-[16px] kiosk:tracking-[2px]";
/** The lineup's up and down buttons. */
const MOVE = "min-h-12 w-12 bg-transparent p-0 text-[22px] kiosk:min-h-16 kiosk:w-16";
/** A dart tile; its border, background and colour come with its state. */
const DART =
  "flex min-h-[76px] flex-col items-stretch justify-between border px-2.5 py-2 text-left normal-case kiosk:min-h-[104px] kiosk:flex-row kiosk:items-end kiosk:px-4 kiosk:py-3";
/** "REMOVE DARTS" between two rules. */
const VISIT_STATUS =
  "m-0 flex min-h-11 items-center gap-3 font-pixel text-[13px] uppercase tracking-[2px] before:h-px before:flex-1 before:content-[''] after:h-px after:flex-1 after:content-[''] kiosk:min-h-10 kiosk:gap-3 kiosk:text-[18px] kiosk:tracking-[3px]";

export function StationPage({ id }: { id: number }) {
  const { view, connected, send } = useStation(id);
  const [error, setError] = useState<string | null>(null);

  const run: Send = async (command) => {
    const message = await send(command);
    setError(message);
    return message;
  };

  const match = view?.match ?? null;
  const sound = useCallouts(match);
  return (
    <main className="flex min-h-[100dvh] flex-col">
      <header className="flex items-center justify-between gap-2 kiosk:gap-4 border-0 border-border border-b border-solid kiosk:px-6 px-4 kiosk:py-3 py-2.5">
        <div className="flex min-w-0 items-center gap-4">
          <Logo width="86px" className="max-kiosk:hidden" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap font-pixel kiosk:text-[20px] text-[13px] text-text uppercase kiosk:tracking-[2px] tracking-[1px]">
            {view?.name ?? `Station ${id}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 kiosk:gap-2.5">
          {sound.needsTap && <SoundPrompt />}
          <ThemeStar className="kiosk:size-14 size-11" star="w-5 kiosk:w-6" />
          <BoardMenu
            stationId={id}
            online={view?.boardOnline ?? false}
            running={view?.boardRunning ?? true}
            connected={connected}
            takeout={view?.takeout ?? false}
            matchAction={match ? matchAction(match, run) : undefined}
            sound={sound}
          />
        </div>
      </header>
      {match && match.state.phase !== "matchWon" && <SettingsStrip match={match} />}
      <div className="flex flex-1 flex-col gap-4 kiosk:gap-4 p-4 kiosk:px-6 kiosk:pt-6 kiosk:pb-6">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {!view ? (
          <p className="hint m-auto">Connecting…</p>
        ) : !match ? (
          <QuickMatch send={run} notice={view.notice} />
        ) : match.state.phase === "notStarted" ? (
          <Lineup match={match} send={run} />
        ) : (
          <Match match={match} send={run} takeout={view.takeout} />
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

function SettingsStrip({ match }: { match: MatchView }) {
  return (
    <div className="label flex flex-wrap justify-between gap-x-4 gap-y-1.5 border-0 border-line-soft border-b border-solid kiosk:px-6 px-4 kiosk:py-2.5 py-2">
      {match.label && <span className="text-text">{match.label}</span>}
      <span>{liveLabel(match)}</span>
    </div>
  );
}

/** Pick players from the list (or add one), choose settings, then go to the lineup. */
function QuickMatch({ send, notice }: { send: Send; notice: string | null }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [settings, setSettings] = useState<SetupSettings>(defaultSetupSettings);

  return (
    <div className="flex flex-1 kiosk:flex-row flex-col kiosk:flex-wrap kiosk:items-stretch gap-4 kiosk:gap-x-6 kiosk:gap-y-6">
      {notice && <p className="notice kiosk:basis-full">{notice}</p>}
      <section className="flex kiosk:min-w-0 kiosk:flex-[999_1_560px] flex-col gap-4 kiosk:gap-4">
        <div>
          <h1 className="kiosk:text-[40px]">New match</h1>
          <p className="hint m-0 mt-1.5">You can change the order next.</p>
        </div>
        <PlayerPicker title="Players" picked={picked} onChange={setPicked} />
      </section>
      <section className="flex flex-1 kiosk:flex-[1_1_380px] flex-col gap-2.5 kiosk:gap-4 kiosk:self-start kiosk:border border-0 border-border border-t border-solid kiosk:bg-panel kiosk:p-6 pt-4 [&_.settings]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] kiosk:[&_.settings]:grid-cols-[1fr] kiosk:[&_.settings]:gap-4 kiosk:[&_.settings_label]:text-[12px] kiosk:[&_select]:min-h-14 [&_select]:min-w-0 kiosk:[&_select]:text-[28px]">
        <span className="label">Match settings</span>
        <SettingsFields value={settings} onChange={setSettings} playerCount={picked.length} />
        <button
          type="button"
          className="primary cta kiosk:mt-2 max-kiosk:mt-auto"
          disabled={picked.length < MIN_PLAYERS}
          onClick={() =>
            send({ type: "quickMatch", playerIds: picked, settings: settingsInput(settings) })
          }
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
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-4 kiosk:gap-6 kiosk:pt-6">
      <div className="flex flex-col gap-2">
        {match.label && <span className="match-label kiosk:text-[13px]">{match.label}</span>}
        <h1 className="kiosk:text-[48px]">Throwing order</h1>
        <p className="hint m-0">Top of the list throws first.</p>
      </div>
      <ol className="m-0 flex list-none flex-col gap-2 kiosk:gap-2.5 p-0">
        {match.players.map((p, i) => (
          <li
            key={p.id}
            className="flex kiosk:min-h-24 min-h-[72px] items-center gap-3 kiosk:gap-4 border border-border border-solid bg-surface kiosk:pr-3 pr-2.5 kiosk:pl-6 pl-3 [--avatar:48px] kiosk:[--avatar:64px]"
          >
            <span className="kiosk:w-10 w-7 font-pixel kiosk:text-[20px] text-[13px] text-muted">
              {String(i + 1).padStart(2, "0")}
            </span>
            <Avatar player={p} />
            <span className="wrap-anywhere min-w-0 flex-1 font-pixel kiosk:text-[26px] text-[16px] uppercase kiosk:tracking-[2px] tracking-[1px]">
              {p.name}
            </span>
            <button
              type="button"
              aria-label={`Move ${p.name} up`}
              disabled={i === 0}
              onClick={() => move(i, i - 1)}
              className={MOVE}
            >
              <PixelIcon name="up" />
            </button>
            <button
              type="button"
              aria-label={`Move ${p.name} down`}
              disabled={i === match.players.length - 1}
              onClick={() => move(i, i + 1)}
              className={MOVE}
            >
              <PixelIcon name="down" />
            </button>
          </li>
        ))}
      </ol>
      <div className={CONTROLS}>
        <button type="button" className={SECONDARY} onClick={shuffle}>
          Shuffle
        </button>
        <button
          type="button"
          className="primary cta kiosk:min-h-20"
          onClick={() => send({ type: "startMatch" })}
        >
          Start <PixelIcon name="arrow" height="0.9em" />
        </button>
      </div>
    </div>
  );
}

function Match({ match, send, takeout }: { match: MatchView; send: Send; takeout: boolean }) {
  const [correcting, setCorrecting] = useState<DartView | null>(null);
  const [adding, setAdding] = useState(false);

  if (match.state.phase === "matchWon") {
    return (
      <MatchOver match={match}>
        <div className={`${CONTROLS} w-full max-w-[760px]`}>
          <button type="button" className={SECONDARY} onClick={() => send({ type: "undo" })}>
            Undo
          </button>
          <button
            type="button"
            className="primary cta kiosk:min-h-20"
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
    <section className="flex kiosk:grid flex-1 kiosk:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] kiosk:grid-rows-[1fr_auto] flex-col gap-4 kiosk:gap-x-4 kiosk:gap-y-4 kiosk:[&>.scoreboard]:col-span-full">
      <Scoreboard
        match={match}
        onDart={setCorrecting}
        onAdd={() => setAdding(true)}
        hints
        takeout={takeout}
      />

      <div className="kiosk:m-0 mt-auto kiosk:flex grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] kiosk:flex-col gap-2 kiosk:gap-3">
        <button
          type="button"
          className="kiosk:min-h-[72px] min-h-[60px] kiosk:flex-1 flex-col items-start gap-1.5 kiosk:gap-1.5 px-6 font-bold kiosk:text-[20px] text-[16px] kiosk:tracking-[2px]"
          onClick={() => send({ type: "nextPlayer" })}
        >
          <span className="kiosk:text-[22px]">
            Next player <PixelIcon name="arrow" height="0.9em" />
          </span>
          <span className="font-normal kiosk:text-[16px] text-[12px]">
            Up: {match.players[upNext(match.state)]?.name}
          </span>
        </button>
        <button
          type="button"
          className="-order-1 kiosk:order-none kiosk:min-h-16 min-h-[60px] kiosk:text-[16px] kiosk:tracking-[2px]"
          onClick={() => send({ type: "undo" })}
        >
          Undo
        </button>
      </div>

      {correcting && (
        <SegmentPicker
          title="Correct"
          dart={dartLabel(correcting.segment)}
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

interface ScoreboardProps {
  match: MatchView;
  /** Darts can be tapped to correct them. */
  onDart?: (dart: DartView) => void;
  /** The next empty slot can be tapped to add a dart the board missed. */
  onAdd?: () => void;
  /** Show the thrower's checkout route on wide screens. */
  hints?: boolean;
  takeout?: boolean;
}

/** Scores, the current visit and whose turn it is. */
export function Scoreboard(props: ScoreboardProps) {
  const targets = targetsOf(props.match);
  if (targets) {
    const golf = golfOf(props.match);
    const cricket = cricketOf(props.match);
    const checkout = checkoutOf(props.match);
    const wide = golf || cricket;
    return (
      <>
        <div
          className={`scoreboard grid min-h-0 gap-3 kiosk:gap-4 ${wide ? "kiosk:grid-cols-[auto_minmax(0,1fr)]" : "kiosk:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]"}`}
        >
          <TargetBoard
            highlight={targets.highlight}
            label={targets.label}
            className={`w-[min(72vw,34vh)] self-center justify-self-center ${wide ? "kiosk:w-[min(520px,calc(100dvh-440px))]" : "kiosk:w-[min(100%,calc(100dvh-440px))]"}`}
          />
          {golf ? (
            <Scorecard state={golf.state} holes={golf.holes} players={props.match.players} />
          ) : cricket ? (
            <CricketGrid state={cricket} players={props.match.players} />
          ) : checkout ? (
            <div className="grid min-w-0 content-start gap-1.5 kiosk:gap-2">
              <CheckoutPanel state={checkout.state} route={checkout.route} />
              <PlayerList match={props.match} />
            </div>
          ) : (
            <PlayerList match={props.match} />
          )}
        </div>
        <VisitPanel {...props} />
      </>
    );
  }
  return (
    <>
      <PlayerCards match={props.match} hints={props.hints ?? false} />
      <VisitPanel {...props} />
    </>
  );
}

/** The visit in progress: three dart tiles, the total or bust, and what happens next. */
function VisitPanel(props: ScoreboardProps) {
  const { match, onDart, onAdd } = props;
  const { state, players } = match;
  const visit = state.currentVisit;
  const visitTotal = visit?.bust ? 0 : visitValue(match.settings.mode, visit?.darts ?? []);
  const totalLabel = visitTotalLabel(match.settings.mode);
  const nameOf = (player: PlayerIndex) => players[player]?.name ?? "?";
  // The dart that broke the visit, shown in red.
  const bustDart = visit?.bust ? visit.darts.findLast((d) => !d.ignored) : undefined;

  return (
    <section
      className={`flex min-w-0 flex-col gap-2 kiosk:gap-3 border-solid p-3 kiosk:px-6 kiosk:py-4 ${visit?.bust ? "border border-danger bg-danger-tint outline-2 outline-danger outline-solid -outline-offset-3" : "border border-border bg-panel"}`}
      aria-label="Current visit"
    >
      <div className="label flex items-center justify-between gap-3">
        <span>Visit</span>
        <span className="grid items-center justify-items-end">
          <span
            className={`font-bold kiosk:text-[28px] text-[20px] text-danger tracking-[3px] [grid-area:1/1] ${visit?.bust ? "" : "invisible"}`}
            aria-hidden={!visit?.bust}
          >
            Bust
          </span>
          <span
            className={`[grid-area:1/1] ${!visit?.bust && visit?.darts.length ? "" : "invisible"}`}
            aria-hidden={visit?.bust || !visit?.darts.length}
          >
            {totalLabel}{" "}
            <span className="align-middle font-text kiosk:text-[48px] text-[36px] text-text">
              {visit?.darts.length ? visitTotal : 0}
            </span>
          </span>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 kiosk:gap-3">
        {[0, 1, 2].map((i) => {
          const dart = visit?.darts[i];
          if (!dart && onAdd && state.phase === "throwing" && i === (visit?.darts.length ?? 0)) {
            return (
              <button
                type="button"
                key={`add-${i}`}
                className={`${DART} border-dashed ${visit?.bust ? "border-danger-line" : "border-border"} bg-transparent text-faint hover:border-accent-line hover:text-accent focus-visible:border-accent-line focus-visible:text-accent`}
                onClick={onAdd}
                aria-label={`Add dart ${i + 1}`}
              >
                <span className="label kiosk:self-start">Dart {i + 1}</span>
                <span className="self-end font-pixel text-[13px] text-muted uppercase tracking-[1px]">
                  + Add
                </span>
              </button>
            );
          }
          if (!dart) {
            const border = visit?.bust ? "border-danger-line" : "border-line-soft";
            return (
              <span
                key={`empty-${i}`}
                className={`${DART} border-dashed ${border} bg-transparent`}
              />
            );
          }
          // Thrown after the visit was over: counts for nothing, crossed out.
          const className = dart.ignored
            ? `${DART} border-dashed border-faint bg-transparent text-muted`
            : `${DART} border-solid ${visit?.bust ? "border-danger-line" : "border-border"} bg-surface ${dart === bustDart ? "text-danger" : "text-text"}`;
          const content = (
            <>
              <span className="label kiosk:self-start">
                {dart.ignored ? "Ignored" : `Dart ${i + 1}`}
              </span>
              <span
                className={`font-text kiosk:text-[72px] text-[36px] kiosk:leading-[0.8] leading-[0.85] tracking-normal ${dart.ignored ? "line-through" : ""}`}
              >
                {dartLabel(dart.segment)}
              </span>
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
      {props.takeout ? (
        <p
          className={`${VISIT_STATUS} font-normal text-muted before:bg-line-soft after:bg-line-soft`}
          role="status"
        >
          Taking out…
        </p>
      ) : state.phase === "awaitingTakeout" ? (
        <p
          className={`${VISIT_STATUS} font-bold text-accent before:bg-accent-line after:bg-accent-line`}
          role="status"
        >
          Remove darts
        </p>
      ) : (
        <p
          className={`${VISIT_STATUS} font-normal text-muted before:bg-line-soft after:bg-line-soft`}
        >
          {!visit?.darts.length
            ? `${nameOf(state.currentPlayer)} to throw`
            : onDart
              ? "Tap a dart to correct it"
              : ""}
        </p>
      )}
    </section>
  );
}
