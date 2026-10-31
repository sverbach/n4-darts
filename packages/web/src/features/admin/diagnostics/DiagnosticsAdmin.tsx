import type { DiagnosticsView } from "@n4/server/api";
import { type ReactNode, useEffect, useState } from "react";

/** How often the page asks again. */
const REFRESH_MS = 2000;

const ms = (value: number | null) =>
  value === null ? "–" : value < 10 ? `${value.toFixed(1)} ms` : `${Math.round(value)} ms`;

/** "45 s", "12 min", "3 h 5 min" */
function duration(seconds: number) {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/** A value coloured by how worrying it is: fine, warn from `warn`, danger from `danger`. */
function Level({ value, warn, danger }: { value: number | null; warn: number; danger: number }) {
  const level = value === null ? "" : value >= danger ? "danger" : value >= warn ? "warn" : "ok";
  return <span className={`diag-value ${level}`}>{ms(value)}</span>;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="admin-section ruled">
      <div className="admin-section-head">
        <h2>{title}</h2>
        {hint && <span className="label">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

/** Whether the server keeps up: event loop, live streams, views, database, boards and darts. */
export function DiagnosticsAdmin() {
  const [view, setView] = useState<DiagnosticsView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/diagnostics");
        if (!res.ok) throw new Error(String(res.status));
        if (!stopped) {
          setView(await res.json());
          setError(null);
        }
      } catch {
        if (!stopped) setError("Server not reachable");
      }
      if (!stopped) timer = setTimeout(load, REFRESH_MS);
    };
    void load();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);

  if (!view) return <p className="hint">{error ?? "Loading…"}</p>;
  const loop = view.eventLoop;
  return (
    <div className="diagnostics">
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="hint">
        Server running since {new Date(view.startedAt).toLocaleString()}. Refreshes every 2 seconds;
        the timings are only collected while this page is open.
      </p>

      <Section
        title="Event loop"
        hint={
          loop.seconds >= 60
            ? "Last minute"
            : loop.seconds < 2
              ? "Starting"
              : `Last ${loop.seconds} s`
        }
      >
        <dl className="diag-stats">
          <div>
            <dt className="label">Median delay</dt>
            <dd>
              <Level value={loop.p50Ms} warn={20} danger={100} />
            </dd>
          </div>
          <div>
            <dt className="label">99th percentile</dt>
            <dd>
              <Level value={loop.p99Ms} warn={50} danger={200} />
            </dd>
          </div>
          <div>
            <dt className="label">Longest</dt>
            <dd>
              <Level value={loop.maxMs} warn={100} danger={500} />
            </dd>
          </div>
        </dl>
      </Section>

      <Section title="Darts" hint="Board message to the station's screens">
        {view.darts.length === 0 ? (
          <p className="hint">No darts since the server started.</p>
        ) : (
          <Table head={["Station", "Dart", "Time", "When"]}>
            {view.darts.map((d) => (
              <tr key={`${d.at}-${d.station}-${d.name}`}>
                <td>{d.station}</td>
                <td>{d.name}</td>
                <td>
                  <Level value={d.ms} warn={100} danger={500} />
                </td>
                <td className="muted">{new Date(d.at).toLocaleTimeString()}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      <Section title="Boards">
        {view.boards.length === 0 ? (
          <p className="hint">No stations.</p>
        ) : (
          <Table head={["Station", "Board", "Reconnects", "Last message", "Last command"]}>
            {view.boards.map((b) => (
              <tr key={b.station}>
                <td>{b.name}</td>
                <td>
                  <span className={`badge ${b.online ? "ok" : "warn"}`}>
                    {b.online ? "Online" : "Offline"}
                  </span>
                </td>
                <td>{b.reconnects}</td>
                <td className="muted">
                  {b.sinceMessageSeconds === null ? "–" : `${duration(b.sinceMessageSeconds)} ago`}
                </td>
                <td>
                  {b.lastCommand ? (
                    <>
                      {b.lastCommand.name}{" "}
                      {b.lastCommand.ok ? (
                        <Level value={b.lastCommand.ms} warn={500} danger={2000} />
                      ) : (
                        <span className="diag-value danger">failed</span>
                      )}
                    </>
                  ) : (
                    "–"
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      <Section title="Live streams" hint={`${view.streams.length} open`}>
        {view.streams.length === 0 ? (
          <p className="hint">No screens connected.</p>
        ) : (
          <Table head={["Kind", "Client", "Open", "Updates", "Browser"]}>
            {view.streams.map((s, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: streams have no id of their own.
              <tr key={i}>
                <td>{s.label ? `${s.kind} · ${s.label}` : s.kind}</td>
                <td>{s.client}</td>
                <td className="muted">{duration(s.openSeconds)}</td>
                <td>{s.updates}</td>
                <td className="muted diag-agent" title={s.userAgent}>
                  {s.userAgent}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      <Section title="Views" hint="Computing each stream's view, last minute">
        {view.views.length === 0 ? (
          <p className="hint">Nothing computed in the last minute.</p>
        ) : (
          <Table head={["Kind", "Per minute", "Average", "Longest"]}>
            {view.views.map((v) => (
              <tr key={v.kind}>
                <td>{v.kind}</td>
                <td>{v.perMinute}</td>
                <td>
                  <Level value={v.averageMs} warn={20} danger={100} />
                </td>
                <td>
                  <Level value={v.maxMs} warn={50} danger={250} />
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      <Section title="Database" hint="Last minute">
        <dl className="diag-stats">
          <div>
            <dt className="label">Writes</dt>
            <dd className="diag-value">{view.database.writesPerMinute}</dd>
          </div>
          <div>
            <dt className="label">Slowest write</dt>
            <dd>
              <Level value={view.database.slowestMs} warn={20} danger={100} />
              {view.database.slowestWrite && (
                <span className="label"> {view.database.slowestWrite}</span>
              )}
            </dd>
          </div>
        </dl>
      </Section>

      <Section title="This page's request">
        <p>
          {view.request.proxied ? (
            <span className="badge warn">Through a proxy</span>
          ) : (
            <span className="badge ok">Direct</span>
          )}{" "}
          <span className="muted">
            from {view.request.client}
            {view.request.host && ` to ${view.request.host}`}
          </span>
        </p>
        {Object.keys(view.request.headers).length > 0 && (
          <Table head={["Header", "Value"]}>
            {Object.entries(view.request.headers).map(([name, value]) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{value}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="table-scroll">
      <table className="diag-table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="label">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
