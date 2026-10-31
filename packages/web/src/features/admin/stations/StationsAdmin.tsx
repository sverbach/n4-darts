import type { StationAdminView } from "@n4/server/api";
import { type FormEvent, type ReactNode, useState } from "react";
import { BoardMenu } from "../../../components/BoardMenu.tsx";
import { PixelIcon } from "../../../components/PixelIcon.tsx";
import { request } from "../../../lib/api.ts";
import { useLive } from "../../../lib/useLive.ts";

export function StationsAdmin() {
  const live = useLive<StationAdminView[]>("/api/admin/stations/live");
  const stations = live.view;
  const [error, setError] = useState<string | null>(null);

  /** Runs a change and shows its error if any; the list updates live. Resolves to success. */
  const change = async (method: string, url: string, body?: object) => {
    const message = await request(method, url, body);
    setError(message);
    return message === null;
  };

  return (
    <div className="stations-admin admin-columns">
      <div className="admin-main">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {!stations ? (
          <p className="hint">Loading…</p>
        ) : stations.length === 0 ? (
          <p className="hint">No stations yet.</p>
        ) : (
          <ul className="card-list">
            {stations.map((s) => (
              <StationRow key={s.id} station={s} change={change} />
            ))}
          </ul>
        )}
      </div>
      <section className="admin-aside panel add-station">
        <h2>Add a station</h2>
        <StationForm
          submitLabel="Add station"
          onSubmit={(name, boardUrl) => change("POST", "/api/admin/stations", { name, boardUrl })}
        >
          <p className="hint">
            The address of the board's Board Manager on the local network, e.g.
            http://192.168.1.139:3180.
          </p>
        </StationForm>
      </section>
    </div>
  );
}

type Change = (method: string, url: string, body?: object) => Promise<boolean>;

function StationRow({ station, change }: { station: StationAdminView; change: Change }) {
  const [editing, setEditing] = useState(false);
  const url = `/api/admin/stations/${station.id}`;

  const menu = (
    <BoardMenu stationId={station.id} online={station.boardOnline} running={station.boardRunning} />
  );
  if (editing) {
    return (
      <li className="card-row editing">
        <div className="card-row-title edit-head">
          <span className="card-row-name">{station.id}. Edit station</span>
          {menu}
        </div>
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
      </li>
    );
  }
  return (
    <li className="card-row">
      <div className="card-row-main">
        <a className="card-row-name" href={`/station/${station.id}`}>
          {station.id}. {station.name}
        </a>
        <code className="board-url">{station.boardUrl}</code>
      </div>
      {menu}
      <div className="card-row-actions">
        <button type="button" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button
          type="button"
          className="danger"
          disabled={station.busy}
          title={station.busy ? "Close or end its match first" : undefined}
          onClick={() => {
            if (confirm(`Remove ${station.name}?`)) void change("DELETE", url);
          }}
        >
          Remove
        </button>
      </div>
    </li>
  );
}

function StationForm(props: {
  initial?: StationAdminView;
  submitLabel: string;
  onSubmit(name: string, boardUrl: string): Promise<boolean>;
  onCancel?(): void;
  children?: ReactNode;
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
    <form className={`station-form ${props.initial ? "edit" : ""}`} onSubmit={submit}>
      <div className="station-form-fields">
        <label className="field small">
          {props.initial ? "Name" : "Name (optional)"}
          <input placeholder="Station 4" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field small">
          Board address
          <input
            placeholder="http://192.168.1.142:3180"
            value={boardUrl}
            required
            inputMode="url"
            onChange={(e) => setBoardUrl(e.target.value)}
          />
        </label>
      </div>
      {props.children}
      {props.onCancel ? (
        <div className="card-row-actions start">
          <button type="submit" className="primary">
            {props.submitLabel}
          </button>
          <button type="button" className="ghost" onClick={props.onCancel}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="submit" className="primary cta">
          {props.submitLabel} <PixelIcon name="arrow" height="0.9em" />
        </button>
      )}
    </form>
  );
}
