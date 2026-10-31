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

export function MatchCard({ match }: { match: TournamentMatchView }) {
  return (
    <div className={`bracket-match ${match.status}`}>
      <div className="bracket-label">{match.label}</div>
      {SIDES.map((side, i) => {
        const p = match.sides[i];
        return (
          <div
            key={side}
            className={`bracket-player ${p && match.winner === p.name ? "winner" : ""}`}
          >
            {p && <Avatar player={p} />}
            <span className="bracket-name">{p?.name ?? "–"}</span>
            {match.legs && <span className="bracket-legs">{match.legs[i]}</span>}
          </div>
        );
      })}
      {!match.legs && STATUS[match.status] && (
        <div className="bracket-status">{STATUS[match.status]}</div>
      )}
    </div>
  );
}
