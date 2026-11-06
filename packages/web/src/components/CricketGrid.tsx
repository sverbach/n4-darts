import { CLOSED, CRICKET_TARGETS, type CricketState, closedBy } from "@n4/engine";
import type { MatchPlayer } from "@n4/server/api";
import { targetLabel } from "../lib/labels.ts";
import type { CardsSize } from "./PlayerCards.tsx";

const STYLE = {
  station: {
    head: "px-2 py-2 font-pixel text-[11px] uppercase kiosk:px-3 kiosk:text-[14px]",
    target: "px-3 py-1.5 text-left text-[22px] kiosk:py-2 kiosk:text-[28px]",
    cell: "px-2 py-1.5 kiosk:py-2",
    mark: "size-[22px] kiosk:size-[30px]",
    points: "px-2 py-2 text-[24px] kiosk:text-[32px]",
  },
  projector: {
    head: "px-pu-12 py-pu-8 font-pixel text-pu-18 uppercase",
    target: "px-pu-16 py-pu-4 text-left text-pu-30",
    cell: "px-pu-12 py-pu-4",
    mark: "size-[calc(30*var(--px))]",
    points: "px-pu-12 py-pu-8 text-pu-36",
  },
};

function Mark({ count, className }: { count: number; className: string }) {
  if (count <= 0) return <span className={`inline-block ${className}`} />;
  return (
    <svg
      viewBox="0 0 24 24"
      className={`inline-block ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      role="img"
      aria-label={count >= CLOSED ? "closed" : `${count} ${count === 1 ? "mark" : "marks"}`}
    >
      <path d="M5 19 19 5" />
      {count >= 2 && <path d="M5 5 19 19" />}
      {count >= CLOSED && <circle cx="12" cy="12" r="10" />}
    </svg>
  );
}

export function CricketGrid(props: {
  state: CricketState;
  players: MatchPlayer[];
  size?: CardsSize;
}) {
  const { state, players } = props;
  const style = STYLE[props.size ?? "station"];
  const on = state.phase === "throwing" || state.phase === "awaitingTakeout";
  const activeCol = (p: number) => (on && state.currentPlayer === p ? "bg-accent-tint" : "");
  return (
    <div className="min-w-0 self-start overflow-x-auto border border-border border-solid bg-panel">
      <table className="w-full border-collapse text-center" aria-label="Cricket marks">
        <thead>
          <tr className="border-0 border-border border-b border-solid">
            <th className={`${style.head} sticky left-0 bg-panel`} />
            {state.players.map((_, p) => (
              <th
                key={players[p]?.id ?? p}
                className={`${style.head} max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap ${activeCol(p)} ${on && state.currentPlayer === p ? "text-accent" : "text-muted"}`}
              >
                {players[p]?.name ?? "?"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CRICKET_TARGETS.map((target) => {
            const dead =
              state.players.every((p) => closedBy(p, target)) ||
              (state.suddenDeath && target !== 25);
            return (
              <tr
                key={target}
                className={`border-0 border-line-soft border-b border-solid ${dead ? "opacity-35" : ""}`}
              >
                <th scope="row" className={`${style.target} sticky left-0 bg-panel font-normal`}>
                  {targetLabel(target)}
                </th>
                {state.players.map((player, p) => (
                  <td
                    key={players[p]?.id ?? p}
                    className={`${style.cell} ${activeCol(p)} ${closedBy(player, target) ? "text-ok" : ""}`}
                  >
                    <Mark count={player.marks[target] ?? 0} className={style.mark} />
                  </td>
                ))}
              </tr>
            );
          })}
          <tr>
            <th scope="row" className={`${style.head} sticky left-0 bg-panel text-left text-muted`}>
              Points
            </th>
            {state.players.map((player, p) => (
              <td
                key={players[p]?.id ?? p}
                className={`${style.points} ${activeCol(p)} ${on && state.currentPlayer === p ? "text-accent" : ""}`}
              >
                {player.points}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
