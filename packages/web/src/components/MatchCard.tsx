import type { TournamentMatchView } from "@n4/server/api";
import { Avatar } from "./Avatar.tsx";

/** What a tournament match is doing, for its card and the fixture lists; empty when it says nothing. */
export const STATUS: Record<TournamentMatchView["status"], string> = {
  waiting: "",
  queued: "Queued",
  "on-station": "On a station",
  playing: "Playing",
  played: "",
  walkover: "Walkover",
};

const SIDES = ["top", "bottom"] as const;

/** The bracket card on the projector (`--px` units); on /admin it keeps its classes for admin.css. */
function projectorStyle(match: TournamentMatchView) {
  const live = match.status === "on-station" || match.status === "playing";
  return {
    card: `flex flex-col border-solid bg-panel ${live ? "border-2 border-accent" : "border border-border"}`,
    label:
      "border-0 border-line-soft border-b border-solid px-pu-14 py-pu-8 font-pixel text-muted text-pu-13 uppercase",
    status: `px-pu-14 py-pu-8 font-pixel text-pu-13 uppercase ${live ? "text-accent" : "text-muted"}`,
    player: (winner: boolean) =>
      `flex h-pu-56 items-center gap-pu-12 border-0 border-line-soft border-b border-solid px-pu-14 avatar-pu-36 ${winner ? "bg-accent-tint text-accent" : ""}`,
    name: "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-pixel text-pu-18 uppercase tracking-pu-2",
    legs: "text-pu-40",
  };
}

export function MatchCard({
  match,
  projector = false,
}: {
  match: TournamentMatchView;
  projector?: boolean;
}) {
  const p = projector ? projectorStyle(match) : null;
  return (
    <div className={p ? p.card : `bracket-match ${match.status}`}>
      <div className={p ? p.label : "bracket-label"}>{match.label}</div>
      {SIDES.map((side, i) => {
        const player = match.sides[i];
        const winner = Boolean(player && match.winner === player.name);
        return (
          <div
            key={side}
            className={p ? p.player(winner) : `bracket-player ${winner ? "winner" : ""}`}
          >
            {player && <Avatar player={player} />}
            <span className={p ? p.name : "bracket-name"}>{player?.name ?? "–"}</span>
            {match.legs && <span className={p ? p.legs : "bracket-legs"}>{match.legs[i]}</span>}
          </div>
        );
      })}
      {!match.legs && STATUS[match.status] && (
        <div className={p ? p.status : "bracket-status"}>{STATUS[match.status]}</div>
      )}
    </div>
  );
}
