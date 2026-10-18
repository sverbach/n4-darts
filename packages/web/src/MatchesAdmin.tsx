import { MIN_PLAYERS } from "@n4/engine";
import type { StationView } from "@n4/server/api";
import { useCallback, useEffect, useState } from "react";
import { request } from "./adminApi.ts";
import { MatchDetailView, MatchHistory } from "./MatchHistory.tsx";
import {
  defaultSetupSettings,
  legsLabel,
  PlayerPicker,
  SettingsFields,
  type SetupSettings,
} from "./MatchSetup.tsx";

/** How often the station overview refreshes. */
const REFRESH_MS = 3000;

export function MatchesAdmin() {
  const [stations, setStations] = useState<StationView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/stations").catch(() => null);
    if (res?.ok) setStations(await res.json());
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const abandon = async (station: StationView) => {
    if (!confirm(`End the match on station ${station.id} without a result?`)) return;
    setError(await request("POST", `/api/admin/stations/${station.id}/abandon`));
    await load();
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
      <h2>New match</h2>
      {stations && <NewMatch stations={stations} onCreated={load} />}
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
        <a href={`/station/${station.id}`}>Station {station.id}</a>
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

function NewMatch({ stations, onCreated }: { stations: StationView[]; onCreated(): void }) {
  const free = stations.filter((s) => !s.match);
  const [picked, setPicked] = useState<string[]>([]);
  const [settings, setSettings] = useState<SetupSettings>(defaultSetupSettings);
  const [stationId, setStationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Fall back to the first free station when none is chosen or the chosen one got busy.
  const target = free.find((s) => s.id === stationId) ?? free[0];

  const submit = async () => {
    if (!target) return;
    const message = await request("POST", "/api/admin/matches", {
      station: target.id,
      playerIds: picked,
      settings,
    });
    setError(message);
    if (message) return;
    setPicked([]);
    setStationId(null);
    onCreated();
  };

  return (
    <div className="new-match">
      <PlayerPicker picked={picked} onChange={setPicked} />
      <SettingsFields value={settings} onChange={setSettings} playerCount={picked.length} />
      <div className="settings">
        <label>
          Station
          <select
            value={target?.id ?? ""}
            disabled={!target}
            onChange={(e) => setStationId(Number(e.target.value))}
          >
            {free.length === 0 && <option value="">All stations busy</option>}
            {free.map((s) => (
              <option key={s.id} value={s.id}>
                Station {s.id}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className="primary"
        disabled={!target || picked.length < MIN_PLAYERS}
        onClick={submit}
      >
        {target
          ? `Put on station ${target.id} · ${settings.startScore}, ${legsLabel(settings.legsToWin, picked.length).toLowerCase()}`
          : "No free station"}
      </button>
    </div>
  );
}
