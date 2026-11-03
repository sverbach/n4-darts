// A fake WLED controller speaking the parts of WLED's JSON API that n4-darts uses: `/json/info`,
// `/presets.json` and `POST /json/state` with `{"ps": n}`. Its page at `/` shows the preset that's on.

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { renderPage } from "./page.ts";

export const DEFAULT_PRESETS = [
  "Idle",
  "Playing",
  "Match start",
  "Leg won",
  "Game shot",
  "180",
  "Bust",
  "High checkout",
];

export interface WledSimOptions {
  /** 0 picks a free port. */
  port?: number;
  host?: string;
  /** The device's name, as `/json/info` reports it. */
  name?: string;
  /** Preset names, numbered from 1. */
  presets?: string[];
}

export interface WledSim {
  readonly url: string;
  readonly port: number;
  /** The preset that's on; null before any. */
  readonly preset: number | null;
  /** Every preset started, oldest first. */
  readonly started: number[];
  /** Offline: every request is dropped, as if the device were unplugged. */
  setOnline(online: boolean): void;
  readonly online: boolean;
  /** Answers only after this long, to test timeouts. */
  setDelay(ms: number): void;
  close(): Promise<void>;
}

export async function createWledSim(options: WledSimOptions = {}): Promise<WledSim> {
  const name = options.name ?? "WLED sim";
  const presets = options.presets ?? DEFAULT_PRESETS;
  let preset: number | null = null;
  const started: number[] = [];
  let online = true;
  let delayMs = 0;

  const view = () => ({
    name,
    online,
    preset,
    presetName: preset === null ? null : (presets[preset - 1] ?? null),
    started: started.slice(-10).reverse(),
  });

  const routes: Record<string, (body: string) => unknown> = {
    "GET /json/info": () => ({ name, ver: "0.15.0", leds: { count: 60 }, mac: "000000000000" }),
    "GET /json/state": () => ({ on: true, bri: 128, ps: preset ?? -1 }),
    // WLED keeps an empty slot 0.
    "GET /presets.json": () =>
      Object.fromEntries([
        ["0", {}],
        ...presets.map((n, i) => [String(i + 1), { n, on: true, bri: 128 }]),
      ]),
    "POST /json/state": (body) => {
      const { ps } = JSON.parse(body) as { ps?: unknown };
      if (typeof ps !== "number" || !presets[ps - 1]) throw new Error("no such preset");
      preset = ps;
      started.push(ps);
      return { success: true };
    },
    "GET /sim/state": () => view(),
    "POST /sim/offline": () => sim.setOnline(false),
    "POST /sim/online": () => sim.setOnline(true),
  };

  async function handle(req: IncomingMessage, res: ServerResponse) {
    const path = new URL(req.url ?? "/", "http://sim").pathname;
    if (req.method === "GET" && path === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page);
      return;
    }
    if (!path.startsWith("/sim/")) {
      if (!online) {
        req.socket.destroy();
        return;
      }
      if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    const route = routes[`${req.method} ${path}`];
    if (!route) {
      res.writeHead(404).end();
      return;
    }
    let body = "";
    for await (const chunk of req) body += chunk;
    try {
      const result = route(body);
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(result ?? {}));
    } catch (error) {
      res
        .writeHead(400, { "content-type": "application/json" })
        .end(JSON.stringify({ error: String(error) }));
    }
  }

  const server = createServer((req, res) => void handle(req, res));
  const host = options.host ?? "127.0.0.1";
  await new Promise<void>((resolve) => server.listen(options.port ?? 0, host, resolve));
  const port = (server.address() as AddressInfo).port;
  const page = renderPage(name);

  const sim = {
    get url() {
      return `http://${host}:${port}`;
    },
    get port() {
      return port;
    },
    get preset() {
      return preset;
    },
    get started() {
      return [...started];
    },
    get online() {
      return online;
    },
    setOnline(next: boolean) {
      online = next;
    },
    setDelay(ms: number) {
      delayMs = ms;
    },
    async close() {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  } satisfies WledSim;
  return sim;
}
