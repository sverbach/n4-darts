import { type GolfState, holeTarget } from "@n4/engine";
import type { MatchPlayer } from "@n4/server/api";
import { targetLabel } from "../lib/labels.ts";
import type { CardsSize } from "./PlayerCards.tsx";

const STYLE = {
  station: {
    frame: "border border-border border-solid bg-panel",
    cell: "px-2 py-2 text-[20px] kiosk:px-2.5 kiosk:py-3 kiosk:text-[26px]",
    head: "px-2 py-2 font-pixel text-[11px] text-muted uppercase kiosk:text-[13px]",
    name: "max-w-[96px] overflow-hidden text-ellipsis whitespace-nowrap px-3 font-pixel text-[13px] uppercase kiosk:max-w-[160px] kiosk:text-[16px]",
  },
  projector: {
    frame: "border border-border border-solid bg-panel",
    cell: "px-pu-10 py-pu-14 text-pu-36",
    head: "px-pu-10 py-pu-12 font-pixel text-muted text-pu-18 uppercase",
    name: "max-w-[calc(220*var(--px))] overflow-hidden text-ellipsis whitespace-nowrap px-pu-16 font-pixel text-pu-22 uppercase",
  },
};

export function Scorecard(props: {
  state: GolfState;
  players: MatchPlayer[];
  holes: number;
  size?: CardsSize;
}) {
  const { state, players, holes } = props;
  const style = STYLE[props.size ?? "station"];
  const count = Math.max(holes, state.round);
  const nine = props.size === "projector" ? Math.floor((state.round - 1) / 9) * 9 : 0;
  const shown = props.size === "projector" ? Math.min(9, count - nine) : count;
  const columns = Array.from({ length: shown }, (_, i) => nine + i + 1);
  const on = state.phase === "throwing" || state.phase === "awaitingTakeout";
  return (
    <div className={`min-w-0 self-start overflow-x-auto ${style.frame}`}>
      <table className="w-full border-collapse text-center" aria-label="Scorecard">
        <thead>
          <tr className="border-0 border-border border-b border-solid">
            <th className={`${style.head} sticky left-0 bg-panel text-left`}>Hole</th>
            {columns.map((hole) => (
              <th
                key={hole}
                className={`${style.head} ${on && hole === state.round ? "text-accent" : ""}`}
              >
                {targetLabel(holeTarget(hole))}
              </th>
            ))}
            <th className={`${style.head} sticky right-0 bg-panel`}>Total</th>
          </tr>
        </thead>
        <tbody>
          {state.players.map((golfer, p) => {
            const active = on && state.currentPlayer === p;
            return (
              <tr
                key={players[p]?.id ?? p}
                className={`border-0 border-line-soft border-b border-solid last:border-b-0 ${active ? "bg-accent-tint" : ""}`}
              >
                <th
                  scope="row"
                  className={`${style.name} sticky left-0 text-left ${active ? "bg-accent-tint text-accent" : "bg-panel"}`}
                >
                  {players[p]?.name ?? "?"}
                </th>
                {columns.map((hole) => (
                  <td
                    key={hole}
                    className={`${style.cell} ${active && hole === state.round ? "text-accent" : golfer.holes[hole - 1] === 1 ? "text-ok" : ""}`}
                  >
                    {golfer.holes[hole - 1] ?? ""}
                  </td>
                ))}
                <td
                  className={`${style.cell} sticky right-0 font-bold ${active ? "bg-accent-tint" : "bg-panel"}`}
                >
                  {golfer.total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
