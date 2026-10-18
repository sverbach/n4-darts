import type { StationAdminView } from "@n4/server/api";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { request } from "./adminApi.ts";

/** How often board status refreshes. */
const REFRESH_MS = 3000;

export function StationsAdmin() {
  const [stations, setStations] = useState<StationAdminView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/stations").catch(() => null);
    if (res?.ok) setStations(await res.json());
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  /** Runs a change, shows its error if any, and reloads. Resolves to success. */
  const change = async (method: string, url: string, body?: object) => {
    const message = await request(method, url, body);
    setError(message);
    await load();
    return message === null;
  };

  return (
    <div className="stations-admin">
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!stations ? (
        <p className="hint">Loading…</p>
      ) : (
        <ul className="station-list">
          {stations.length === 0 && <p className="hint">No stations yet.</p>}
          {stations.map((s) => (
            <StationRow key={s.id} station={s} change={change} />
          ))}
        </ul>
      )}
      <h2>Add a station</h2>
      <StationForm
        submitLabel="Add station"
        onSubmit={(name, boardUrl) => change("POST", "/api/admin/stations", { name, boardUrl })}
      />
      <p className="hint">
        The board address is the Board Manager on the station laptop, e.g.
        http://192.168.1.139:3180.
      </p>
    </div>
  );
}

type Change = (method: string, url: string, body?: object) => Promise<boolean>;

function StationRow({ station, change }: { station: StationAdminView; change: Change }) {
  const [editing, setEditing] = useState(false);
  const url = `/api/admin/stations/${station.id}`;

  return (
    <li className="station-row">
      <div className="station-row-head">
        <a href={`/station/${station.id}`}>
          {station.id}. {station.name}
        </a>
        <span className={`status ${station.boardOnline ? "ok" : "warn"}`}>
          {station.boardOnline ? "Board online" : "Board offline"}
        </span>
      </div>
      {editing ? (
        <StationForm
          initial={station}
          submitLabel="Save"
          onCancel={() => setEditing(false)}
          onSubmit={async (name, boardUrl) => {
            const ok = await change("PATCH", url, { name, boardUrl });
            if (ok) setEditing(false);
            return ok;
          }}
        />
      ) : (
        <>
          <p className="station-row-match">{station.boardUrl}</p>
          <div className="station-row-actions">
            <button type="button" className="ghost" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button
              type="button"
              className="ghost danger"
              disabled={station.busy}
              title={station.busy ? "Close or end its match first" : undefined}
              onClick={() => {
                if (confirm(`Remove ${station.name}?`)) void change("DELETE", url);
              }}
            >
              Remove
            </button>
          </div>
        </>
      )}
    </li>
  );
}

function StationForm(props: {
  initial?: StationAdminView;
  submitLabel: string;
  onSubmit(name: string, boardUrl: string): Promise<boolean>;
  onCancel?(): void;
}) {
  const [name, setName] = useState(props.initial?.name ?? "");
  const [boardUrl, setBoardUrl] = useState(props.initial?.boardUrl ?? "http://");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if ((await props.onSubmit(name, boardUrl)) && !props.initial) {
      setName("");
      setBoardUrl("http://");
    }
  };

  return (
    <form className="station-form" onSubmit={submit}>
      <input
        aria-label="Station name"
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        aria-label="Board address"
        placeholder="http://192.168.1.139:3180"
        value={boardUrl}
        required
        inputMode="url"
        onChange={(e) => setBoardUrl(e.target.value)}
      />
      <div className="station-row-actions">
        <button type="submit" className="primary">
          {props.submitLabel}
        </button>
        {props.onCancel && (
          <button type="button" className="ghost" onClick={props.onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
