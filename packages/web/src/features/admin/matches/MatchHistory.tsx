import type { DartView } from "@n4/engine";
import type { MatchDetail, MatchSummary } from "@n4/server/api";
import { useState } from "react";
import { PixelIcon } from "../../../components/PixelIcon.tsx";
import { SegmentPicker } from "../../../components/SegmentPicker.tsx";
import { request } from "../../../lib/api.ts";
import { dartLabel } from "../../../lib/darts.ts";
import { matchRulesLabel } from "../../../lib/labels.ts";
import { useLive } from "../../../lib/useLive.ts";
import { HEAD, runState, TABLE_PANEL } from "../ui.ts";

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";
const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" }) : "Not finished";
const time = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString(undefined, { timeStyle: "short" }) : "";

/** "Ann won 2–1", for the detail's line. */
function result(match: MatchSummary) {
  if (match.abandoned) return "Abandoned";
  const winner = match.players.find((p) => p.id === match.winner);
  if (!winner) return match.closedAt ? "No winner (corrected)" : "In progress";
  const legs = match.settings.legsToWin > 1 ? ` ${match.legsWon.join("–")}` : "";
  return `${winner.name} won${legs}`;
}

/** The history's result column: the legs ("2–1"), as the players column names the winner. */
function score(match: MatchSummary) {
  if (match.abandoned) return "Abandoned";
  if (!match.winner) return match.closedAt ? "No winner (corrected)" : "In progress";
  return match.legsWon.join("–");
}

/** The history by evening: the date once, then that evening's matches. */
function byDay(matches: MatchSummary[]) {
  const days = new Map<string, MatchSummary[]>();
  for (const m of matches) days.set(day(m.closedAt), [...(days.get(day(m.closedAt)) ?? []), m]);
  return [...days];
}

/**
 * A dart in the match detail: corrected (framed, the original crossed out above), added by hand
 * (dashed: the board missed it), or thrown after the visit was over (dashed, crossed out).
 */
function dartStyle(ignored: boolean, corrected: boolean, added: boolean) {
  const border = `${ignored || added ? "border-dashed" : ""} ${corrected ? "border-accent" : ""}`;
  const fill = ignored
    ? "bg-transparent text-muted line-through"
    : corrected
      ? "bg-accent-tint"
      : "";
  const type = `${corrected ? "text-[24px]" : "text-[26px]"} ${corrected || added ? "leading-[0.9]" : ""}`;
  return `min-h-[46px] flex-col gap-0 p-0 font-text normal-case tracking-normal ${border} ${fill} ${type}`;
}

export function MatchHistory({ onOpen }: { onOpen(id: string): void }) {
  // Live: a match that finishes, or a correction that changes a result, shows up by itself.
  const matches = useLive<MatchSummary[]>("/api/admin/matches/live").view;

  if (!matches) return <p className="hint">Loading…</p>;
  if (matches.length === 0) return <p className="hint">No finished matches yet.</p>;
  return (
    <div className={TABLE_PANEL}>
      <div className="label kiosk:grid hidden min-h-11 grid-cols-[minmax(0,1fr)_auto] kiosk:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_120px_24px] items-center gap-x-4 gap-y-1 border-0 border-border border-b border-solid px-5 kiosk:[&>span:nth-child(3)]:text-right">
        <span>Players</span>
        <span>Result</span>
        <span>Time</span>
      </div>
      {byDay(matches).map(([date, list]) => (
        <section key={date} aria-label={date}>
          <h3 className="m-0 border-0 border-line-soft border-b border-solid bg-surface kiosk:px-5 px-4 py-2">
            {date}
          </h3>
          <ul className="m-0 list-none p-0">
            {list.map((m) => (
              <li key={m.id} className="border-0 border-line-soft border-b border-solid">
                <button
                  type="button"
                  onClick={() => onOpen(m.id)}
                  className="grid min-h-[60px] w-full grid-cols-[minmax(0,1fr)_auto] kiosk:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_120px_24px] items-center gap-x-4 gap-y-1 border-0 bg-transparent kiosk:px-5 px-4 kiosk:py-0 py-2.5 text-left font-text normal-case tracking-normal kiosk:[&_.pixel-icon]:block [&_.pixel-icon]:hidden kiosk:[&_.pixel-icon]:h-[14px] kiosk:[&_.pixel-icon]:text-accent"
                >
                  {/* The winner in full colour, the others grey: the result column only needs the legs. */}
                  <span className="font-pixel text-[13px] uppercase tracking-[1px]">
                    {m.players.map((p, i) => (
                      <span key={p.id}>
                        {i > 0 && <span className="text-muted"> vs </span>}
                        <span className={m.winner && p.id !== m.winner ? "text-muted" : ""}>
                          {p.name}
                        </span>
                        {p.id === m.winner && <span className="sr-only"> (won)</span>}
                      </span>
                    ))}
                  </span>
                  <span
                    className={`kiosk:row-auto row-start-2 kiosk:text-[24px] text-[22px] ${m.abandoned || !m.winner ? "text-muted" : ""}`}
                  >
                    {score(m)}
                  </span>
                  <span className="text-right font-pixel kiosk:text-[12px] text-[11px] text-muted [grid-column:2] [grid-row:1/span_2] kiosk:[grid-column:auto] kiosk:[grid-row:auto]">
                    {time(m.closedAt)}
                  </span>
                  <PixelIcon name="arrow" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function MatchDetailView({ id, onBack }: { id: string; onBack(): void }) {
  const live = useLive<MatchDetail>(`/api/admin/matches/${id}/live`);
  const match = live.view;
  const [error, setError] = useState<string | null>(null);
  const [correcting, setCorrecting] = useState<DartView | null>(null);

  const correct = async (dartId: string, segment: DartView["segment"]) => {
    // Refused e.g. for a tournament result a later match already depends on. The corrected match
    // arrives through the live stream.
    setError(await request("POST", `/api/admin/matches/${id}/corrections`, { dartId, segment }));
  };

  const name = (i: number) => match?.players[i]?.name ?? "?";

  return (
    <div className="flex flex-col gap-6">
      <button type="button" className="back self-start" onClick={onBack}>
        <PixelIcon name="back" height="0.7em" /> Matches
      </button>
      {(error ?? live.failed) && (
        <p className="error" role="alert">
          {error ?? "Couldn't load the match"}
        </p>
      )}
      {!match ? (
        <p className="hint">Loading…</p>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className={HEAD}>
              {!match.closedAt && <span className={runState(true)}>Live</span>}
              <h1>{match.players.map((p) => p.name).join(" vs ")}</h1>
              <p className="hint">
                {result(match)} · {matchRulesLabel(match.settings)}
                {match.station !== null && ` · Station ${match.station}`}
                {match.closedAt && ` · ${when(match.closedAt)}`}
              </p>
            </div>
            <span className="hint">Tap a dart to correct it.</span>
          </div>
          {match.state.legs.map((leg, legIndex) => (
            // Only the last leg can be without darts, so the first dart identifies a leg.
            <details
              key={leg.visits[0]?.darts[0]?.dartId ?? "current-leg"}
              className="max-w-[760px]"
              open={legIndex === match.state.legs.length - 1}
            >
              <summary className="bg-surface px-3.5 text-text">
                <PixelIcon name="caret" /> Leg {legIndex + 1} · {name(leg.starter)} starts
                {/* Who won each leg, unless it was the only one (the line above says it). */}
                {leg.winner !== null && match.state.legs.length > 1 && ` · ${name(leg.winner)} won`}
              </summary>
              <ol className="m-0 list-none p-0">
                {[
                  ...leg.visits,
                  ...(legIndex === match.state.legs.length - 1 && match.state.currentVisit
                    ? [match.state.currentVisit]
                    : []),
                ].map((visit, visitIndex) => (
                  <li
                    key={visit.darts[0]?.dartId ?? `visit-${visitIndex}`}
                    className="grid min-h-[58px] grid-cols-[minmax(0,70px)_minmax(0,1fr)_auto] items-center gap-2 border-0 border-line-soft border-b border-solid"
                  >
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap font-pixel text-[13px] uppercase">
                      {name(visit.player)}
                    </span>
                    <span className="grid grid-cols-[repeat(3,minmax(0,72px))] gap-2">
                      {visit.darts.map((dart) => {
                        const original = match.originals[dart.dartId];
                        const added = match.added.includes(dart.dartId);
                        return (
                          <button
                            type="button"
                            key={dart.dartId}
                            className={dartStyle(dart.ignored, Boolean(original), added)}
                            onClick={() => setCorrecting(dart)}
                            aria-label={`Correct ${dartLabel(dart.segment)}`}
                            title={added ? "Added by hand: the board missed it" : undefined}
                          >
                            {original && (
                              <s className="text-[16px] text-muted">{dartLabel(original)}</s>
                            )}
                            <span>{dartLabel(dart.segment)}</span>
                            {added && (
                              <small className="font-pixel text-[9px] text-muted uppercase">
                                added
                              </small>
                            )}
                          </button>
                        );
                      })}
                    </span>
                    <span
                      className={`min-w-[3em] text-right text-[28px] ${visit.bust ? "text-danger" : ""}`}
                    >
                      {visit.bust ? "Bust" : visit.darts.reduce((sum, d) => sum + d.score, 0)}
                      {visit.checkout && " ✓"}
                    </span>
                  </li>
                ))}
              </ol>
            </details>
          ))}
        </>
      )}
      {correcting && (
        <SegmentPicker
          title={`Correct ${dartLabel(correcting.segment)}`}
          current={correcting.segment}
          onCancel={() => setCorrecting(null)}
          onPick={(segment) => {
            setCorrecting(null);
            void correct(correcting.dartId, segment);
          }}
        />
      )}
    </div>
  );
}
