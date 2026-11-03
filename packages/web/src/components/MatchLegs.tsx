import type { DartView, MatchState } from "@n4/engine";
import type { ReactNode } from "react";
import { PixelIcon } from "./PixelIcon.tsx";

/**
 * A match's legs, the last one open: each visit's player, darts and score. `dart` draws a dart:
 * a button to correct it in admin, its value on the stats pages.
 */
export function MatchLegs(props: {
  state: MatchState;
  name: (player: number) => string;
  dart: (dart: DartView) => ReactNode;
}) {
  const { state, name, dart } = props;
  return state.legs.map((leg, legIndex) => (
    // Only the last leg can be without darts, so the first dart identifies a leg.
    <details
      key={leg.visits[0]?.darts[0]?.dartId ?? "current-leg"}
      className="max-w-[760px]"
      open={legIndex === state.legs.length - 1}
    >
      <summary className="bg-surface px-3 text-text">
        <PixelIcon name="caret" /> Leg {legIndex + 1} · {name(leg.starter)} starts
        {leg.winner !== null && state.legs.length > 1 && ` · ${name(leg.winner)} won`}
      </summary>
      <ol className="m-0 list-none p-0">
        {[
          ...leg.visits,
          ...(legIndex === state.legs.length - 1 && state.currentVisit ? [state.currentVisit] : []),
        ].map((visit, visitIndex) => (
          <li
            key={visit.darts[0]?.dartId ?? `visit-${visitIndex}`}
            className="grid min-h-[58px] grid-cols-[minmax(0,70px)_minmax(0,1fr)_auto] items-center gap-2 border-0 border-line-soft border-b border-solid"
          >
            <span className="overflow-hidden text-ellipsis whitespace-nowrap font-pixel text-[13px] uppercase">
              {name(visit.player)}
            </span>
            <span className="grid grid-cols-[repeat(3,minmax(0,72px))] gap-2">
              {visit.darts.map(dart)}
            </span>
            <span
              className={`min-w-[3em] text-right text-[28px] ${visit.bust ? "text-danger" : ""}`}
            >
              {visit.bust ? "Bust" : visit.darts.reduce((sum, d) => sum + d.score, 0)}
              {visit.checkout && (
                <span className="ml-2 align-middle font-pixel text-[11px] text-muted uppercase">
                  Out
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </details>
  ));
}
