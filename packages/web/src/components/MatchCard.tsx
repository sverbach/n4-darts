import type { TournamentMatchView } from "@n4/server/api";
import { Link } from "wouter";
import { NONE } from "../lib/format.ts";
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
        "border-0 border-line-soft border-b border-solid px-pu-14 py-pu-8 font-pixel text-muted text-pu-20 uppercase",
      status: `px-pu-14 py-pu-8 font-pixel text-pu-20 uppercase ${live ? "text-accent" : "text-muted"}`,
      player: (winner: boolean) =>
        `flex h-pu-56 items-center gap-pu-12 border-0 border-line-soft border-b border-solid px-pu-14 avatar-pu-36 ${match.winner ? (winner ? "font-bold" : "text-muted") : ""}`,
      name: "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-pixel text-pu-20 uppercase tracking-pu-2",
      legs: "text-pu-40",
    };
  }
  return {
    card: `border border-solid bg-panel ${live ? "border-accent" : "border-border"}`,
    label:
      "border-0 border-line-soft border-b border-solid px-3 py-2 font-pixel text-[11px] text-muted uppercase",
    status: `px-3 py-2 font-pixel text-[11px] uppercase ${live ? "text-accent" : "text-muted"}`,
    player: (winner: boolean) =>
      `flex min-h-[46px] items-center gap-2.5 border-0 border-line-soft border-b border-solid px-3 [--avatar:28px] ${match.winner ? (winner ? "font-bold" : "text-muted") : ""}`,
    name: "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-pixel text-[13px] uppercase",
    legs: "text-[28px]",
  };
}

const ownLabel = (label: string, round?: string) =>
  round && label.startsWith(round) ? label.slice(round.length).trim() : label;

export function MatchCard({
  match,
  round,
  projector = false,
  href,
}: {
  match: TournamentMatchView;
  round?: string;
  projector?: boolean;
  /** Makes the card a link (to the match's page). */
  href?: string | undefined;
}) {
  const p = cardStyle(match, projector);
  const label = ownLabel(match.label, round);
  const content = (
    <>
      {label && <div className={p.label}>{label}</div>}
      {SIDES.map((side, i) => {
        const player = match.sides[i];
        const winner = Boolean(player && match.winner === player.name);
        return (
          <div key={side} className={p.player(winner)}>
            {player && <Avatar player={player} />}
            <span className={p.name}>{player?.name ?? NONE}</span>
            {match.legs && <span className={p.legs}>{match.legs[i]}</span>}
          </div>
        );
      })}
      {match.status === "walkover" && <div className={p.status}>{STATUS.walkover}</div>}
    </>
  );
  return href ? (
    <Link href={href} className={`${p.card} text-text no-underline`}>
      {content}
    </Link>
  ) : (
    <div className={p.card}>{content}</div>
  );
}
