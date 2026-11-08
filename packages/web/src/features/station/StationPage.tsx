import { type DartView, MIN_PLAYERS, type PlayerIndex, upNext } from "@n4/engine";
import type { MatchView, StationCommand } from "@n4/server/api";
import { useState } from "react";
import { Avatar } from "../../components/Avatar.tsx";
import { BoardMenu, type MatchAction } from "../../components/BoardMenu.tsx";
import { CricketGrid } from "../../components/CricketGrid.tsx";
import { TargetBoard } from "../../components/Dartboard.tsx";
import { MatchOver } from "../../components/MatchOver.tsx";
import { hasModePanel, ModePanel } from "../../components/ModePanel.tsx";
import { PixelIcon } from "../../components/PixelIcon.tsx";
import { PlayerCards, PlayerList } from "../../components/PlayerCards.tsx";
import { PlayerPicker } from "../../components/PlayerPicker.tsx";
import { Scorecard } from "../../components/Scorecard.tsx";
import { SegmentPicker } from "../../components/SegmentPicker.tsx";
import { SoundPrompt } from "../../components/Sound.tsx";
import { TopBar } from "../../components/TopBar.tsx";
import { dartLabel } from "../../lib/darts.ts";
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
      <TopBar
        hideLogoOnPhone
        start={
          <span className="font-pixel kiosk:text-[20px] text-text kiosk:tracking-[2px] overflow-hidden text-[13px] tracking-[1px] text-ellipsis whitespace-nowrap uppercase">
            {view?.name ?? `Station ${id}`}
          </span>
        }
        end={sound.needsTap && <SoundPrompt />}
        menu={
          <BoardMenu
            stationId={id}
            online={view?.boardOnline ?? false}
            running={view?.boardRunning ?? true}
            connected={connected}
            takeout={view?.takeout ?? false}
            matchAction={match ? matchAction(match, run) : undefined}
            sound={sound}
          />
        }
      />
      {match && match.state.phase !== "matchWon" && <SettingsStrip match={match} />}
      <div className="kiosk:gap-4 kiosk:px-6 kiosk:pt-6 kiosk:pb-6 flex flex-1 flex-col gap-4 p-4">
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
    <div className="label kiosk:px-6 kiosk:py-2.5 flex flex-wrap justify-between gap-x-4 gap-y-1.5 px-4 py-2">
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
    <div className="kiosk:flex-row kiosk:flex-wrap kiosk:items-stretch kiosk:gap-x-6 kiosk:gap-y-6 flex flex-1 flex-col gap-4">
      {notice && <p className="notice kiosk:basis-full">{notice}</p>}
      <section className="kiosk:min-w-0 kiosk:flex-[999_1_560px] kiosk:gap-4 flex flex-col gap-4">
        <div>
          <h1 className="kiosk:text-[40px]">New match</h1>
          <p className="hint m-0 mt-1.5">You can change the order next.</p>
        </div>
        <PlayerPicker title="Players" picked={picked} onChange={setPicked} />
      </section>
      <section className="kiosk:flex-[1_1_380px] kiosk:gap-4 kiosk:self-start kiosk:border border-border kiosk:bg-panel kiosk:p-6 kiosk:[&_.settings]:grid-cols-[1fr] kiosk:[&_.settings]:gap-4 kiosk:[&_.settings_label]:text-[12px] kiosk:[&_select]:min-h-14 kiosk:[&_select]:text-[28px] flex flex-1 flex-col gap-2.5 border-0 border-t border-solid pt-4 [&_.settings]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] [&_select]:min-w-0">
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
    <div className="kiosk:gap-6 kiosk:pt-6 mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-4">
      <div className="flex flex-col gap-2">
        {match.label && <span className="match-label kiosk:text-[13px]">{match.label}</span>}
        <h1 className="kiosk:text-[48px]">Throwing order</h1>
        <p className="hint m-0">Top of the list throws first.</p>
      </div>
      <ol className="kiosk:gap-2.5 m-0 flex list-none flex-col gap-2 p-0">
        {match.players.map((p, i) => (
          <li
            key={p.id}
            className="kiosk:min-h-24 kiosk:gap-4 border-border bg-surface kiosk:pr-3 kiosk:pl-6 kiosk:[--avatar:64px] flex min-h-[72px] items-center gap-3 border border-solid pr-2.5 pl-3 [--avatar:48px]"
          >
            <span className="kiosk:w-10 font-pixel kiosk:text-[20px] text-muted w-7 text-[13px]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <Avatar player={p} />
            <span className="font-pixel kiosk:text-[26px] kiosk:tracking-[2px] min-w-0 flex-1 text-[16px] tracking-[1px] wrap-anywhere uppercase">
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
    <section className="kiosk:grid kiosk:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] kiosk:grid-rows-[1fr_auto] kiosk:gap-x-4 kiosk:gap-y-4 kiosk:[&>.scoreboard]:col-span-full flex flex-1 flex-col gap-4">
      <Scoreboard
        match={match}
        onDart={setCorrecting}
        onAdd={() => setAdding(true)}
        hints
        takeout={takeout}
      />

      <div className="kiosk:m-0 kiosk:flex kiosk:flex-col kiosk:gap-3 mt-auto grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2">
        <button
          type="button"
          className="kiosk:min-h-[72px] kiosk:flex-1 kiosk:gap-1.5 kiosk:text-[20px] kiosk:tracking-[2px] min-h-[60px] flex-col items-start gap-1.5 px-6 text-[16px] font-bold"
          onClick={() => send({ type: "nextPlayer" })}
        >
          <span className="kiosk:text-[22px]">
            Next player <PixelIcon name="arrow" height="0.9em" />
          </span>
          <span className="kiosk:text-[16px] text-[12px] font-normal">
            Up: {match.players[upNext(match.state)]?.name}
          </span>
        </button>
        <button
          type="button"
          className="kiosk:order-none kiosk:min-h-16 kiosk:text-[16px] kiosk:tracking-[2px] -order-1 min-h-[60px]"
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
    const wide = golf || cricket;
    return (
      <>
        <div
          className={`scoreboard kiosk:gap-4 grid min-h-0 gap-3 ${wide ? "kiosk:grid-cols-[auto_minmax(0,1fr)]" : "kiosk:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]"}`}
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
          ) : hasModePanel(props.match) ? (
            <div className="kiosk:gap-2 grid min-w-0 content-start gap-1.5">
              <ModePanel match={props.match} />
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
      className={`kiosk:gap-3 kiosk:px-6 kiosk:py-4 flex min-w-0 flex-col gap-2 border-solid p-3 ${visit?.bust ? "border-danger bg-danger-tint outline-danger border outline-2 -outline-offset-3 outline-solid" : "border-border bg-panel border"}`}
      aria-label="Current visit"
    >
      <div className="label flex items-center justify-between gap-3">
        <span>Visit</span>
        <span className="grid items-center justify-items-end">
          <span
            className={`kiosk:text-[28px] text-danger text-[20px] font-bold tracking-[3px] [grid-area:1/1] ${visit?.bust ? "" : "invisible"}`}
            aria-hidden={!visit?.bust}
          >
            Bust
          </span>
          <span
            className={`[grid-area:1/1] ${!visit?.bust && visit?.darts.length ? "" : "invisible"}`}
            aria-hidden={visit?.bust || !visit?.darts.length}
          >
            {totalLabel}{" "}
            <span className="font-text kiosk:text-[48px] text-text align-middle text-[36px]">
              {visit?.darts.length ? visitTotal : 0}
            </span>
          </span>
        </span>
      </div>
      <div className="kiosk:gap-3 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => {
          const dart = visit?.darts[i];
          if (!dart && onAdd && state.phase === "throwing" && i === (visit?.darts.length ?? 0)) {
            return (
              <button
                type="button"
                key={`add-${i}`}
                className={`${DART} border-dashed ${visit?.bust ? "border-danger-line" : "border-border"} text-faint hover:border-accent-line hover:text-accent focus-visible:border-accent-line focus-visible:text-accent bg-transparent`}
                onClick={onAdd}
                aria-label={`Add dart ${i + 1}`}
              >
                <span className="label kiosk:self-start">Dart {i + 1}</span>
                <span className="font-pixel text-muted self-end text-[13px] tracking-[1px] uppercase">
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
                className={`font-text kiosk:text-[72px] kiosk:leading-[0.8] text-[36px] leading-[0.85] tracking-normal ${dart.ignored ? "line-through" : ""}`}
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
          className={`${VISIT_STATUS} text-muted before:bg-line-soft after:bg-line-soft font-normal`}
          role="status"
        >
          Taking out…
        </p>
      ) : state.phase === "awaitingTakeout" ? (
        <p
          className={`${VISIT_STATUS} text-accent before:bg-accent-line after:bg-accent-line font-bold`}
          role="status"
        >
          Remove darts
        </p>
      ) : (
        <p
          className={`${VISIT_STATUS} text-muted before:bg-line-soft after:bg-line-soft font-normal`}
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
