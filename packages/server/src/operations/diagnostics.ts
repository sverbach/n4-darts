// Diagnostics (diagnostics ticket 01): whether the server keeps up during an evening, so a slow
// evening can be explained from data. Counting open streams and timing darts is always on (an
// increment and a timestamp); the event-loop monitor and the view and write timings only run
// while someone has had the page open in the last two minutes.

import type { IncomingHttpHeaders } from "node:http";
import { monitorEventLoopDelay, performance } from "node:perf_hooks";
import type { BoardDiagnostics, DiagnosticsView, StreamKind } from "../api.ts";

const MINUTE_MS = 60_000;
/** The page polls; after this long without a poll, the costlier collectors stop. */
const IDLE_MS = 2 * MINUTE_MS;
const LAST_DARTS = 20;
/** The event-loop monitor's sampling interval; each sample includes it, so it's taken off. */
const RESOLUTION_MS = 10;

interface OpenStream {
  kind: StreamKind;
  label: string | null;
  client: string;
  userAgent: string;
  openedAt: number;
  updates: number;
}

/** Times within the last minute, for averages and counts per minute. */
class Window {
  private samples: { at: number; ms: number; label?: string }[] = [];

  add(ms: number, label?: string) {
    const at = performance.now();
    this.samples.push(label === undefined ? { at, ms } : { at, ms, label });
    this.trim(at);
  }

  summary() {
    this.trim(performance.now());
    const ms = this.samples.map((s) => s.ms);
    const slowest = this.samples.reduce<(typeof this.samples)[number] | null>(
      (best, s) => (best === null || s.ms > best.ms ? s : best),
      null,
    );
    return {
      count: ms.length,
      averageMs: ms.length === 0 ? null : ms.reduce((a, b) => a + b, 0) / ms.length,
      maxMs: slowest?.ms ?? null,
      slowest: slowest?.label ?? null,
    };
  }

  private trim(now: number) {
    while (this.samples[0] && now - this.samples[0].at > MINUTE_MS) this.samples.shift();
  }
}

export function createDiagnostics() {
  const startedAt = Date.now();
  let viewedAt = Number.NEGATIVE_INFINITY;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const active = () => performance.now() - viewedAt < IDLE_MS;

  // The event loop: delays over the last full minute, or since the page was opened.
  const loop = monitorEventLoopDelay({ resolution: RESOLUTION_MS });
  const delay = (ns: number) => Math.max(0, ns / 1e6 - RESOLUTION_MS);
  let loopSince = 0;
  let lastMinute: DiagnosticsView["eventLoop"] | null = null;
  const loopNow = (): DiagnosticsView["eventLoop"] => ({
    seconds: Math.round((performance.now() - loopSince) / 1000),
    p50Ms: delay(loop.percentile(50)),
    p99Ms: delay(loop.percentile(99)),
    maxMs: delay(loop.max),
  });

  let nextStream = 0;
  const streams = new Map<number, OpenStream>();
  const views = new Map<StreamKind, Window>();
  const writes = new Window();
  const darts: DiagnosticsView["darts"] = [];

  function wake() {
    if (!active()) {
      loop.reset();
      loop.enable();
      loopSince = performance.now();
      lastMinute = null;
    }
    viewedAt = performance.now();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => loop.disable(), IDLE_MS);
    idleTimer.unref();
    if (performance.now() - loopSince >= MINUTE_MS) {
      lastMinute = loopNow();
      loop.reset();
      loopSince = performance.now();
    }
  }

  return {
    /** A live stream opened; call `update` with how long each view took, `close` when it ends. */
    openStream(
      kind: StreamKind,
      label: string | null,
      request: { ip: string; headers: IncomingHttpHeaders },
    ) {
      const id = nextStream++;
      const stream: OpenStream = {
        kind,
        label,
        client: forwardedFor(request.headers) ?? request.ip,
        userAgent: request.headers["user-agent"] ?? "",
        openedAt: Date.now(),
        updates: 0,
      };
      streams.set(id, stream);
      return {
        /** Called after each recompute of the view, whether or not it was sent. */
        computed(ms: number) {
          if (!active()) return;
          const window = views.get(kind) ?? new Window();
          views.set(kind, window);
          window.add(ms);
        },
        sent() {
          stream.updates += 1;
        },
        close() {
          streams.delete(id);
        },
      };
    },

    /** Times a database write, while the page is open. */
    timeWrite<T>(name: string, write: () => T): T {
      if (!active()) return write();
      const start = performance.now();
      try {
        return write();
      } finally {
        writes.add(performance.now() - start, name);
      }
    },

    /** A dart reached the station's streams `ms` after the board's message arrived. */
    dart(station: number, name: string, ms: number) {
      darts.unshift({ station, name, ms, at: new Date().toISOString() });
      darts.length = Math.min(darts.length, LAST_DARTS);
    },

    view(
      request: { ip: string; headers: IncomingHttpHeaders },
      boards: BoardDiagnostics[],
    ): DiagnosticsView {
      wake();
      const now = Date.now();
      const header = (name: string) => {
        const value = request.headers[name];
        return Array.isArray(value) ? value.join(", ") : (value ?? null);
      };
      const proxyHeaders = Object.fromEntries(
        Object.keys(request.headers)
          .filter(
            (name) => name.startsWith("x-forwarded-") || name === "via" || name === "x-real-ip",
          )
          .map((name) => [name, header(name) as string]),
      );
      return {
        startedAt: new Date(startedAt).toISOString(),
        eventLoop: lastMinute ?? loopNow(),
        streams: [...streams.values()]
          .sort((a, b) => a.openedAt - b.openedAt)
          .map((s) => ({
            kind: s.kind,
            label: s.label,
            client: s.client,
            userAgent: s.userAgent,
            openSeconds: Math.round((now - s.openedAt) / 1000),
            updates: s.updates,
          })),
        views: [...views.entries()]
          .map(([kind, window]) => {
            const { count, averageMs, maxMs } = window.summary();
            return { kind, perMinute: count, averageMs, maxMs };
          })
          .filter((v) => v.perMinute > 0),
        database: (() => {
          const { count, maxMs, slowest } = writes.summary();
          return { writesPerMinute: count, slowestMs: maxMs, slowestWrite: slowest };
        })(),
        boards,
        darts,
        request: {
          client: request.ip,
          host: header("host"),
          proxied: Object.keys(proxyHeaders).length > 0,
          headers: proxyHeaders,
        },
      };
    },
  };
}

function forwardedFor(headers: IncomingHttpHeaders) {
  const value = headers["x-forwarded-for"];
  const first = (Array.isArray(value) ? value[0] : value)?.split(",")[0]?.trim();
  return first || undefined;
}

export type Diagnostics = ReturnType<typeof createDiagnostics>;

/** One recorder for the process: the board gateways, stations and streams all report to it. */
export const diagnostics = createDiagnostics();
