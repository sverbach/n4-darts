// Live views as Server-Sent Events: each stream recomputes its view after a change from the feed
// (live.ts) and sends it only when it's different from the last one it sent. Also the projector's
// routes (/api/display).

import { performance } from "node:perf_hooks";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { DisplayView, StreamKind } from "../api.ts";
import { diagnostics } from "../operations/diagnostics.ts";
import type { ChangeFeed } from "./live.ts";

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

/** The projector's view, once and as a stream. */
export function registerDisplay(
  app: FastifyInstance,
  display: () => DisplayView,
  feed: ChangeFeed,
) {
  app.get("/api/display", async () => display());
  app.get("/api/display/live", (request, reply) =>
    streamView(request, reply, feed.subscribe, display, { kind: "display" }),
  );
}
