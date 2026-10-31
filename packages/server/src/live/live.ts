// Live views as Server-Sent Events (spec: "Live updates everywhere"). One feed hears about every
// change (a database write or a station's view changing); each stream recomputes its view after a
// change and sends it only when it's different from the last one it sent.

import { performance } from "node:perf_hooks";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { StreamKind } from "../api.ts";
import type { Db } from "../db.ts";
import { diagnostics } from "../operations/diagnostics.ts";
import type { StationDirectory } from "../stations/stations.ts";

export interface ChangeFeed {
  /** Called at most once per turn of the event loop, after a burst of changes has settled. */
  subscribe(listener: () => void): () => void;
  close(): void;
}

export function createChangeFeed(db: Db, stations: StationDirectory): ChangeFeed {
  const listeners = new Set<() => void>();
  const watched = new Set<object>();
  const unsubscribes: (() => void)[] = [];
  let pending = false;
  let closed = false;

  // Stations added in /admin are a database write, so they're picked up on the next change.
  function watchStations() {
    for (const station of stations.list()) {
      if (watched.has(station)) continue;
      watched.add(station);
      unsubscribes.push(station.subscribe(changed));
    }
  }

  function changed() {
    if (pending || closed) return;
    pending = true;
    // A station writes to the database before it updates its own view: wait for both.
    setImmediate(() => {
      pending = false;
      if (closed) return;
      watchStations();
      for (const listener of listeners) listener();
    });
  }

  watchStations();
  unsubscribes.push(db.onChange(changed));

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close() {
      closed = true;
      for (const unsubscribe of unsubscribes) unsubscribe();
      listeners.clear();
    },
  };
}

/**
 * Answers the request with a stream: the view now, then again whenever it changes. `stream` says
 * what it shows, for /admin diagnostics.
 */
export function streamView(
  request: FastifyRequest,
  reply: FastifyReply,
  subscribe: (listener: () => void) => () => void,
  view: () => unknown,
  stream: { kind: StreamKind; label?: string },
) {
  const recorder = diagnostics.openStream(stream.kind, stream.label ?? null, request);
  reply.hijack();
  const res = reply.raw;
  res.writeHead(200, {
    "content-type": "text/event-stream",
    // A proxy in front (nginx buffers by default) would hold messages back until its buffer
    // fills: turn buffering off for nginx, and keep any proxy from compressing the stream.
    "cache-control": "no-cache, no-transform",
    "x-accel-buffering": "no",
    connection: "keep-alive",
  });
  let last = "";
  const send = () => {
    const start = performance.now();
    const json = JSON.stringify(view());
    recorder.computed(performance.now() - start);
    if (json === last) return;
    last = json;
    res.write(`data: ${json}\n\n`);
    recorder.sent();
  };
  send();
  const unsubscribe = subscribe(send);
  // Well under nginx's default proxy_read_timeout of 60 s, so a proxy doesn't drop a quiet stream.
  const keepAlive = setInterval(() => res.write(": keep-alive\n\n"), 25_000);
  request.raw.on("close", () => {
    clearInterval(keepAlive);
    unsubscribe();
    recorder.close();
  });
}
