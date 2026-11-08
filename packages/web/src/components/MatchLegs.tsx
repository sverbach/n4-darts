import { allVisits, type DartView, type MatchState, type VisitView } from "@n4/engine";
import type { ReactNode } from "react";
import { visitValue } from "../lib/modes.ts";
import { PixelIcon } from "./PixelIcon.tsx";

interface Props {
  state: MatchState;
  name: (player: number) => string;
  dart: (dart: DartView) => ReactNode;
  who?: ((player: number) => ReactNode) | undefined;
}

/**
 * A match's legs, the last one open: each visit's player, darts and score. `dart` draws a dart:
 * a button to correct it in admin, its value on the stats pages.
 */
export function MatchLegs(props: Props) {
  const { state, name, dart, who } = props;
  if (state.mode !== "x01") {
    return (
      <ol className="m-0 max-w-[760px] list-none p-0">
        {allVisits(state).map((visit, visitIndex) => (
          <VisitRow
            key={visit.darts[0]?.dartId ?? `visit-${visitIndex}`}
            visit={visit}
            name={name}
            dart={dart}
            who={who}
            score={state.mode !== "aroundTheClock"}
            value={(v) => visitValue(state.mode, v.darts)}
          />
        ))}
      </ol>
    );
  }
  return state.legs.map((leg, legIndex) => (
    // Only the last leg can be without darts, so the first dart identifies a leg.
    <details
      key={leg.visits[0]?.darts[0]?.dartId ?? "current-leg"}
      className="max-w-[760px]"
      open={legIndex === state.legs.length - 1}
    >
      <summary className="bg-surface text-text px-3">
        <PixelIcon name="caret" /> Leg {legIndex + 1} · {name(leg.starter)} starts
        {leg.winner !== null && state.legs.length > 1 && ` · ${name(leg.winner)} won`}
      </summary>
      <ol className="m-0 list-none p-0">
        {[
          ...leg.visits,
          ...(legIndex === state.legs.length - 1 && state.currentVisit ? [state.currentVisit] : []),
        ].map((visit, visitIndex) => (
          <VisitRow
            key={visit.darts[0]?.dartId ?? `visit-${visitIndex}`}
            visit={visit}
            name={name}
            dart={dart}
            who={who}
            score
          />
        ))}
      </ol>
    </details>
  ));
}

function VisitRow(
  props: Omit<Props, "state"> & {
    visit: VisitView;
    score: boolean;
    value?: (visit: VisitView) => number;
  },
) {
  const { visit, name, dart, score, value, who } = props;
  return (
    <li
      className={`border-line-soft grid items-center gap-2 border-0 border-b border-solid ${who ? "grid-cols-[minmax(0,1fr)_auto] py-2.5" : "min-h-[58px] grid-cols-[minmax(0,70px)_minmax(0,1fr)_auto]"}`}
    >
      {who ? (
        <span className="col-span-full">{who(visit.player)}</span>
      ) : (
        <span className="font-pixel overflow-hidden text-[13px] text-ellipsis whitespace-nowrap uppercase">
          {name(visit.player)}
        </span>
      )}
      <span className="grid grid-cols-[repeat(3,minmax(0,72px))] gap-2">
        {visit.darts.map(dart)}
      </span>
      {score && (
        <span className={`min-w-[3em] text-right text-[28px] ${visit.bust ? "text-danger" : ""}`}>
          {visit.bust
            ? "Bust"
            : (value?.(visit) ?? visit.darts.reduce((sum, d) => sum + d.score, 0))}
          {visit.checkout && (
            <span className="font-pixel text-muted ml-2 align-middle text-[11px] uppercase">
              Out
            </span>
          )}
        </span>
      )}
    </li>
  );
}
