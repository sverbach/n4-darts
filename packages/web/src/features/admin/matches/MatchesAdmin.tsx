import type { StationView } from "@n4/server/api";
import { useState } from "react";
import { BoardStatus } from "../../../components/BoardMenu.tsx";
import { request } from "../../../lib/api.ts";
import { useLive } from "../../../lib/useLive.ts";
import { MatchDetailView, MatchHistory } from "./MatchHistory.tsx";

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
      <section className="admin-section">
        <h2>Stations</h2>
        {!stations ? (
          <p className="hint">Loading…</p>
        ) : (
          <ul className="station-cards">
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
      </section>
      <section className="admin-section">
        <h2>History</h2>
        <MatchHistory onOpen={setOpenId} />
      </section>
    </div>
  );
}

function StationRow(props: { station: StationView; onAbandon(): void; onOpen(): void }) {
  const { station, onAbandon, onOpen } = props;
  const { match } = station;
  return (
    <li className="station-card">
      <div className="card-row-title spread">
        <a className="card-row-name" href={`/station/${station.id}`}>
          {station.name}
        </a>
        <BoardStatus online={station.boardOnline} running={station.boardRunning} />
      </div>
      <span className={`station-card-summary ${match ? "" : "hint"}`}>
        {match ? matchSummary(match) : "Free"}
      </span>
      {match && (
        <div className="card-row-actions start">
          {match.state.phase !== "notStarted" && (
            <button type="button" onClick={onOpen}>
              Details
            </button>
          )}
          <button type="button" className="danger" onClick={onAbandon}>
            {match.state.phase === "notStarted" ? "Cancel match" : "End match"}
          </button>
        </div>
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
