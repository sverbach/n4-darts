// Live views as Server-Sent Events (spec: "Live updates everywhere"). One feed hears about every
// change (a database write or a station's view changing); each stream recomputes its view after a
// change and sends it only when it's different from the last one it sent.

import type { FastifyReply, FastifyRequest } from "fastify";
import type { Db } from "./db.ts";
import type { StationDirectory } from "./stations.ts";

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

/** Answers the request with a stream: the view now, then again whenever it changes. */
export function streamView(
  request: FastifyRequest,
  reply: FastifyReply,
  subscribe: (listener: () => void) => () => void,
  view: () => unknown,
) {
  reply.hijack();
  const res = reply.raw;
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive",
  });
  let last = "";
  const send = (value: unknown) => {
    const json = JSON.stringify(value);
    if (json === last) return;
    last = json;
    res.write(`data: ${json}\n\n`);
  };
  send(view());
  const unsubscribe = subscribe(() => send(view()));
  const keepAlive = setInterval(() => res.write(": keep-alive\n\n"), 25_000);
  request.raw.on("close", () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
}
