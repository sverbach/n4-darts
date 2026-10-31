import type { StationAdminView } from "@n4/server/api";
import { type FormEvent, type ReactNode, useState } from "react";
import { BoardMenu } from "../../../components/BoardMenu.tsx";
import { PixelIcon } from "../../../components/PixelIcon.tsx";
import { request } from "../../../lib/api.ts";
import { useLive } from "../../../lib/useLive.ts";
import {
  CARD_LIST,
  CARD_MAIN,
  CARD_NAME,
  COLUMNS,
  cardActions,
  cardRow,
  cardTitle,
  MAIN,
} from "../ui.ts";

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
    <div className={COLUMNS}>
      <div className={MAIN}>
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
          <ul className={CARD_LIST}>
            {stations.map((s) => (
              <StationRow key={s.id} station={s} change={change} />
            ))}
          </ul>
        )}
      </div>
      <section className="flex min-w-0 flex-[1_1_340px] flex-col gap-3.5 border border-border border-solid bg-panel p-[22px]">
        <h2>Add a station</h2>
        <StationForm
          submitLabel="Add station"
          onSubmit={(name, boardUrl) => change("POST", "/api/admin/stations", { name, boardUrl })}
        >
          <p className="hint m-0 text-[19px]">
            The address of the board's Board Manager on the local network, e.g.
            http://192.168.1.139:3180.
          </p>
        </StationForm>
      </section>
    </div>
  );
}

/** A label above its input, smaller than FIELD: the station forms. */
const FIELD_SMALL =
  "flex flex-col gap-2 font-pixel text-[11px] text-muted uppercase tracking-[1px] [&_input]:min-h-12 [&_input]:bg-bg [&_input]:text-[24px] [&_input]:text-text [&_input]:normal-case [&_input]:tracking-normal";

type Change = (method: string, url: string, body?: object) => Promise<boolean>;

function StationRow({ station, change }: { station: StationAdminView; change: Change }) {
  const [editing, setEditing] = useState(false);
  const url = `/api/admin/stations/${station.id}`;

  const menu = (
    <BoardMenu
      stationId={station.id}
      online={station.boardOnline}
      running={station.boardRunning}
      quiet
    />
  );
  if (editing) {
    return (
      <li className={cardRow(true)}>
        <div className={cardTitle(true)}>
          <span className={CARD_NAME}>{station.id}. Edit station</span>
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
    <li className={cardRow()}>
      <div className={CARD_MAIN}>
        <a className={CARD_NAME} href={`/station/${station.id}`}>
          {station.id}. {station.name}
        </a>
        <code className="wrap-anywhere font-text text-[22px] text-muted">{station.boardUrl}</code>
      </div>
      {menu}
      <div className={cardActions()}>
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
    <form className="flex flex-col gap-3.5" onSubmit={submit}>
      <div
        className={`grid gap-3 ${props.initial ? "grid-cols-[repeat(auto-fit,minmax(200px,1fr))]" : "grid-cols-[1fr]"}`}
      >
        <label className={FIELD_SMALL}>
          {props.initial ? "Name" : "Name (optional)"}
          <input placeholder="Station 4" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className={FIELD_SMALL}>
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
        <div className={cardActions(true)}>
          <button type="submit" className="primary">
            {props.submitLabel}
          </button>
          <button type="button" className="ghost" onClick={props.onCancel}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="submit" className="primary cta min-h-14! text-[14px]!">
          {props.submitLabel} <PixelIcon name="arrow" height="0.9em" />
        </button>
      )}
    </form>
  );
}
