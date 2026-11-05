// Live views over WebSockets: each socket recomputes its view after a change from the feed
// (live.ts) and sends it only when it's different from the last one it sent. A live route that
// can't stream closes the socket with 4000 + the HTTP status it would have answered, and the error
// as the reason (docs/adr/0011). Also the projector's routes (/api/display).

import { performance } from "node:perf_hooks";
import websocket from "@fastify/websocket";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { WebSocket } from "ws";
import type { DisplayView, StreamKind } from "../api.ts";
import { diagnostics } from "../operations/diagnostics.ts";
import { requestProblem } from "../parse.ts";
import type { ChangeFeed } from "./live.ts";

/** Under nginx's default proxy_read_timeout of 60 s, which applies to WebSockets too. */
export const PING_MS = 25_000;

/** Why a live route won't stream: the HTTP status it stands for, and the error text. */
export class Refusal extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const refused = new WeakMap<FastifyRequest, Refusal>();

/** A request to open a socket rather than an ordinary request. */
export const isLiveRequest = (request: FastifyRequest) =>
  request.headers.upgrade?.toLowerCase() === "websocket";

/**
 * Marks a socket request to be closed with `status` once it's open: a hook can't answer it with
 * an HTTP status the browser would get to see.
 */
export function refuseLive(request: FastifyRequest, status: number, error: string) {
  refused.set(request, new Refusal(status, error));
}

/** Lets the app serve live routes: declare them in `.after()`, once the plugin has loaded. */
export function enableLive(app: FastifyInstance) {
  return app.register(websocket);
}

export interface LiveSocket {
  /** Sends one message: JSON already serialised. */
  send(json: string): void;
  onClose(listener: () => void): void;
}

function liveSocket(ws: WebSocket): LiveSocket {
  let answered = true;
  ws.on("pong", () => {
    answered = true;
  });
  const ping = setInterval(() => {
    if (!answered) return ws.terminate();
    answered = false;
    ws.ping();
  }, PING_MS);
  ws.on("close", () => clearInterval(ping));
  return {
    send: (json) => ws.send(json),
    onClose: (listener) => ws.on("close", listener),
  };
}

function refusalOf(error: unknown) {
  if (error instanceof Refusal) return error;
  const problem = requestProblem(error);
  return problem === null ? null : new Refusal(400, problem);
}

/** A socket route. `open` throws a `Refusal` (or a `parse` error) to refuse it. */
export function liveRoute(
  app: FastifyInstance,
  url: string,
  open: (socket: LiveSocket, request: FastifyRequest) => void,
) {
  app.get(url, { websocket: true }, (ws, request) => {
    try {
      const refusal = refused.get(request);
      if (refusal) throw refusal;
      open(liveSocket(ws), request);
    } catch (error) {
      const refusal = refusalOf(error);
      if (!refusal) {
        ws.close(1011);
        throw error;
      }
      ws.close(4000 + refusal.status, refusal.message);
    }
  });
}

/** What a live view shows: `kind` and `label` are for /admin diagnostics. */
export interface LiveView {
  subscribe: (listener: () => void) => () => void;
  view: () => unknown;
  kind: StreamKind;
  label?: string;
}

/** Sends the view now, then again whenever it changes, until the socket closes. */
export function streamView(socket: LiveSocket, request: FastifyRequest, live: LiveView) {
  const recorder = diagnostics.openStream(live.kind, live.label ?? null, request);
  let last = "";
  const send = () => {
    const start = performance.now();
    const json = JSON.stringify(live.view());
    recorder.computed(performance.now() - start);
    if (json === last) return;
    last = json;
    socket.send(json);
    recorder.sent();
  };
  send();
  const unsubscribe = live.subscribe(send);
  socket.onClose(() => {
    unsubscribe();
    recorder.close();
  });
}

/** A live route that streams one view. */
export function liveView(
  app: FastifyInstance,
  url: string,
  follow: (request: FastifyRequest) => LiveView,
) {
  liveRoute(app, url, (socket, request) => streamView(socket, request, follow(request)));
}

/** The projector's view, once and as a stream. */
export function registerDisplay(
  app: FastifyInstance,
  display: () => DisplayView,
  feed: ChangeFeed,
) {
  app.get("/api/display", async () => display());
  liveView(app, "/api/display/live", () => ({
    subscribe: feed.subscribe,
    view: display,
    kind: "display",
  }));
}
