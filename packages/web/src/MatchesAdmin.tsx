import type { StationView } from "@n4/server/api";
import { useState } from "react";
import { request } from "./adminApi.ts";
import { MatchDetailView, MatchHistory } from "./MatchHistory.tsx";
import { useLive } from "./useLive.ts";

export function MatchesAdmin() {
  const stations = useLive<StationView[]>("/api/stations/live").view;
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const abandon = async (station: StationView) => {
    if (!confirm(`End the match on ${station.name} without a result?`)) return;
    setError(await request("POST", `/api/admin/stations/${station.id}/abandon`));
  };

  if (openId) return <MatchDetailView id={openId} onBack={() => setOpenId(null)} />;

  return (
    <div className="matches-admin">
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <h2>Stations</h2>
      {!stations ? (
        <p className="hint">Loading…</p>
      ) : (
        <ul className="station-list">
          {stations.map((s) => (
            <StationRow
              key={s.id}
              station={s}
              onAbandon={() => abandon(s)}
              onOpen={() => s.match && setOpenId(s.match.id)}
            />
          ))}
        </ul>
      )}
      <h2>History</h2>
      <MatchHistory onOpen={setOpenId} />
    </div>
  );
}

function StationRow(props: { station: StationView; onAbandon(): void; onOpen(): void }) {
  const { station, onAbandon, onOpen } = props;
  const { match } = station;
  return (
    <li className="station-row">
      <div className="station-row-head">
        <a href={`/station/${station.id}`}>{station.name}</a>
        <span className={`status ${station.boardOnline ? "ok" : "warn"}`}>
          {station.boardOnline ? "Board online" : "Board offline"}
        </span>
      </div>
      {!match ? (
        <p className="hint">Free</p>
      ) : (
        <>
          <p className="station-row-match">{matchSummary(match)}</p>
          <div className="station-row-actions">
            {match.state.phase !== "notStarted" && (
              <button type="button" className="ghost" onClick={onOpen}>
                Details
              </button>
            )}
            <button type="button" className="ghost danger" onClick={onAbandon}>
              {match.state.phase === "notStarted" ? "Cancel match" : "End match"}
            </button>
          </div>
        </>
      )}
    </li>
  );
}

function matchSummary(match: NonNullable<StationView["match"]>) {
  const { state, players } = match;
  const name = (i: number) => players[i]?.name ?? "?";
  if (state.phase === "notStarted") {
    return `${players.map((p) => p.name).join(", ")}: waiting to start`;
  }
  if (state.phase === "matchWon" && state.winner !== null) return `${name(state.winner)} won`;
  return state.players
    .map(
      (p, i) => `${name(i)} ${p.remaining}${match.settings.legsToWin > 1 ? ` (${p.legsWon})` : ""}`,
    )
    .join(" · ");
}
