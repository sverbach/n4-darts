// A fake Autodarts Board Manager speaking the API in docs/board-manager-api.md (v2.0.2).

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { WebSocketServer } from "ws";
import { renderPage } from "./page.ts";
import { type BoardThrow, throwAt, throwFor } from "./throws.ts";

export interface BoardState {
  connected: boolean;
  event: string;
  numThrows: number;
  running: boolean;
  status: string;
  throws?: BoardThrow[];
}

/** What the control page at `/` sees, pushed over `/sim/events`. */
export interface SimView {
  online: boolean;
  state: BoardState;
  /** Clients connected to the Board Manager API's WebSocket, e.g. the n4-darts server. */
  boardClients: number;
}

export interface BoardSimOptions {
  /** 0 picks a free port. */
  port?: number;
  host?: string;
  /** How long auto-calibration takes. */
  calibrationMs?: number;
}

export interface BoardSim {
  readonly url: string;
  readonly port: number;
  readonly state: BoardState;
  /** Throws a dart (notation as in `throwFor`), or a raw throw object. */
  throwDart(dart: string | BoardThrow): void;
  /** Replaces an already detected dart, as if detection changed its mind. */
  reviseDart(index: number, dart: string | BoardThrow): void;
  /** Pulls the darts: "Takeout started" then "Takeout finished". */
  takeout(): void;
  reset(): void;
  stop(): void;
  start(): void;
  /** Auto-calibration: "Calibrating" for `calibrationMs`, then back to throwing. */
  calibrate(): Promise<void>;
  /** Publishes an arbitrary state, e.g. from a recording. */
  publish(state: BoardState): void;
  /** Offline: drops WebSocket clients and refuses all requests until back online. */
  setOnline(online: boolean): void;
  readonly online: boolean;
  close(): Promise<void>;
}

const VERSION = "2.0.2";

export async function createBoardSim(options: BoardSimOptions = {}): Promise<BoardSim> {
  let state: BoardState = {
    connected: true,
    event: "Started",
    numThrows: 0,
    running: true,
    status: "Throw",
  };
  let online = true;

  const wss = new WebSocketServer({ noServer: true });
  // The control page's own channel; it keeps working while the board is "offline".
  const uiWss = new WebSocketServer({ noServer: true });

  const simView = (): SimView => ({ online, state, boardClients: wss.clients.size });
  function notifyUi() {
    const message = JSON.stringify(simView());
    for (const client of uiWss.clients) client.send(message);
  }
  wss.on("connection", (ws) => {
    notifyUi();
    ws.on("close", notifyUi);
  });
  uiWss.on("connection", (ws) => ws.send(JSON.stringify(simView())));

  function publish(next: BoardState) {
    state = next;
    const message = JSON.stringify({ type: "state", data: state });
    for (const client of wss.clients) client.send(message);
    notifyUi();
  }

  function emit(event: string, changes: Partial<BoardState>, throws?: BoardThrow[]) {
    const { throws: _, ...rest } = state;
    const next: BoardState = { ...rest, ...changes, event };
    if (throws?.length) next.throws = throws;
    next.numThrows = throws?.length ?? 0;
    publish(next);
  }

  const toThrow = (dart: string | BoardThrow) => (typeof dart === "string" ? throwFor(dart) : dart);
  /** A control request names a dart (`{"name":"T20"}`) or a spot on the board (`{"coords":…}`). */
  const dartFrom = (body: { name?: string; coords?: { x: number; y: number } }) =>
    body.coords ? throwAt(body.coords) : toThrow(String(body.name));

  const sim = {
    get url() {
      return `http://${host}:${port}`;
    },
    get port() {
      return port;
    },
    get state() {
      return state;
    },
    get online() {
      return online;
    },
    throwDart(dart: string | BoardThrow) {
      const throws = state.throws ?? [];
      // The real board stops detecting after three darts until they're pulled.
      if (!state.running || state.status !== "Throw" || throws.length >= 3) return;
      const next = [...throws, toThrow(dart)];
      emit("Throw detected", { status: next.length === 3 ? "Takeout" : "Throw" }, next);
    },
    reviseDart(index: number, dart: string | BoardThrow) {
      const throws = [...(state.throws ?? [])];
      if (index >= throws.length) throw new Error(`no dart at index ${index}`);
      throws[index] = toThrow(dart);
      emit("Throw detected", {}, throws);
    },
    takeout() {
      if (!state.throws?.length) return;
      emit("Takeout started", { status: "Takeout in progress" }, state.throws);
      emit("Takeout finished", { status: "Throw" });
    },
    reset() {
      emit("Manual reset", { status: "Throw" });
    },
    stop() {
      emit("Stopping", { running: false, status: "Stopping" });
      emit("Stopped", { running: false, status: "Stopped" });
    },
    start() {
      emit("Starting", { running: true, status: "Starting" });
      emit("Started", { running: true, status: "Throw" });
    },
    async calibrate() {
      // Unverified on a real board (docs/board-manager-api.md); a guess at what it reports.
      emit("Calibrating", { status: "Calibrating" });
      await new Promise((resolve) => setTimeout(resolve, options.calibrationMs ?? 1500));
      emit("Calibrated", { status: state.running ? "Throw" : "Stopped" });
    },
    publish,
    setOnline(next: boolean) {
      online = next;
      if (!online) for (const client of wss.clients) client.terminate();
      notifyUi();
    },
    async close() {
      for (const client of [...wss.clients, ...uiWss.clients]) client.terminate();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  } satisfies BoardSim;

  const routes: Record<string, (body: string) => unknown> = {
    "GET /api/state": () => state,
    "GET /api/version": () => VERSION,
    "GET /api/config": () => ({ auth: { api_key: "", board_id: "board-sim" } }),
    "HEAD /api/ping": () => "",
    "PUT /api/start": () => sim.start(),
    "PUT /api/stop": () => sim.stop(),
    "POST /api/config/calibration/auto": () => sim.calibrate(),
    "POST /api/reset": () => sim.reset(),
    // Control API for tests and manual play; not part of the real Board Manager.
    "GET /sim/state": () => simView(),
    "POST /sim/dart": (body) => sim.throwDart(dartFrom(JSON.parse(body))),
    "POST /sim/revise": (body) => {
      const parsed = JSON.parse(body);
      sim.reviseDart(parsed.index, dartFrom(parsed));
    },
    "POST /sim/takeout": () => sim.takeout(),
    // As if someone pressed reset / stop / start in Board Manager on the laptop.
    "POST /sim/reset": () => sim.reset(),
    "POST /sim/stop": () => sim.stop(),
    "POST /sim/start": () => sim.start(),
    "POST /sim/offline": () => sim.setOnline(false),
    "POST /sim/online": () => sim.setOnline(true),
  };

  async function handle(req: IncomingMessage, res: ServerResponse) {
    const path = new URL(req.url ?? "/", "http://sim").pathname;
    if (req.method === "GET" && path === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page);
      return;
    }
    if (!online && !path.startsWith("/sim/")) {
      res.writeHead(503).end();
      return;
    }
    const route = routes[`${req.method} ${path}`];
    if (!route) {
      res.writeHead(404).end();
      return;
    }
    let body = "";
    for await (const chunk of req) body += chunk;
    try {
      const result = await route(body);
      if (typeof result === "string") {
        res.writeHead(200, { "content-type": "text/plain" }).end(result);
      } else {
        res
          .writeHead(200, { "content-type": "application/json" })
          .end(JSON.stringify(result ?? {}));
      }
    } catch (error) {
      res.writeHead(400, { "content-type": "text/plain" }).end(String(error));
    }
  }

  const server = createServer((req, res) => void handle(req, res));
  server.on("upgrade", (req, socket, head) => {
    if (req.url === "/sim/events") {
      uiWss.handleUpgrade(req, socket, head, (ws) => uiWss.emit("connection", ws, req));
      return;
    }
    if (!online || req.url !== "/api/events") {
      socket.end(
        "HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
      );
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  });

  const host = options.host ?? "127.0.0.1";
  await new Promise<void>((resolve) => server.listen(options.port ?? 0, host, resolve));
  const port = (server.address() as AddressInfo).port;
  const page = renderPage(port);
  return sim;
}
