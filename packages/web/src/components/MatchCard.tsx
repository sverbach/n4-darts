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

/** The bracket card, on the projector (`--px` units) or in /admin. */
function cardStyle(match: TournamentMatchView, projector: boolean) {
  const live = match.status === "on-station" || match.status === "playing";
  if (projector) {
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
  return {
    card: `border border-solid bg-panel ${live ? "border-accent" : "border-border"}`,
    label:
      "border-0 border-line-soft border-b border-solid px-3 py-[7px] font-pixel text-[11px] text-muted uppercase",
    status: `px-3 py-[7px] font-pixel text-[11px] uppercase ${live ? "text-accent" : "text-muted"}`,
    player: (winner: boolean) =>
      `flex min-h-[46px] items-center gap-2.5 border-0 border-line-soft border-b border-solid px-3 [--avatar:28px] ${winner ? "bg-accent-tint text-accent" : ""}`,
    name: "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-pixel text-[13px] uppercase",
    legs: "text-[28px]",
  };
}

/**
 * What the card's own label adds under its round's heading: "Semi-final 2" under "Semi-final" is
 * "2", "Final" under "Final" nothing.
 */
const ownLabel = (label: string, round?: string) =>
  round && label.startsWith(round) ? label.slice(round.length).trim() : label;

export function MatchCard({
  match,
  round,
  projector = false,
}: {
  match: TournamentMatchView;
  /** The heading the card sits under; its label only says what the heading doesn't. */
  round?: string;
  projector?: boolean;
}) {
  const p = cardStyle(match, projector);
  const label = ownLabel(match.label, round);
  return (
    <div className={p.card}>
      {label && <div className={p.label}>{label}</div>}
      {SIDES.map((side, i) => {
        const player = match.sides[i];
        const winner = Boolean(player && match.winner === player.name);
        return (
          <div key={side} className={p.player(winner)}>
            {player && <Avatar player={player} />}
            <span className={p.name}>{player?.name ?? "–"}</span>
            {match.legs && <span className={p.legs}>{match.legs[i]}</span>}
          </div>
        );
      })}
      {!match.legs && STATUS[match.status] && (
        <div className={p.status}>{STATUS[match.status]}</div>
      )}
    </div>
  );
}
