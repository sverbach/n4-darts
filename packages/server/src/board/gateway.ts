// One connection to one Autodarts Board Manager (docs/adr/0001). Turns its full-state snapshots
// into board events and sends commands. Knows nothing about games.

import type { Segment } from "@n4/engine";

/** A Board Manager state snapshot (docs/board-manager-api.md). */
export interface BoardSnapshot {
  connected: boolean;
  event: string;
  numThrows: number;
  running: boolean;
  status: string;
  throws?: BoardThrow[];
}

export interface BoardThrow {
  bouncer: boolean;
  coords: { x: number; y: number };
  segment: { bed: string; multiplier: number; name: string; number: number };
}

export interface DetectedDart {
  /** Position in the board's current visit, 0–2. */
  index: number;
  segment: Segment;
  /** Board Manager's own name, e.g. `T20`, `M17`, `Miss`. */
  name: string;
  coords: { x: number; y: number };
  bouncer: boolean;
}

export type BoardEvent =
  | { type: "BoardOnline"; snapshot: BoardSnapshot }
  | { type: "BoardOffline" }
  | ({ type: "DartDetected" } & DetectedDart)
  | ({ type: "DartRevised" } & DetectedDart)
  | { type: "TakeoutStarted" }
  | { type: "TakeoutFinished" }
  | { type: "BoardReset" }
  | { type: "BoardStopped" }
  | { type: "BoardStarted" };

export interface BoardGatewayOptions {
  /** Board Manager base URL, e.g. `http://192.168.1.139:3180`. */
  url: string;
  onEvent: (event: BoardEvent) => void;
  /** First reconnect delay; doubles up to `maxReconnectDelayMs`. */
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
}

export interface BoardGateway {
  readonly online: boolean;
  start(): Promise<void>;
  stop(): Promise<void>;
  reset(): Promise<void>;
  close(): void;
}

function toDart(index: number, t: BoardThrow): DetectedDart {
  const { number, multiplier } = t.segment;
  return {
    index,
    segment: { number, multiplier: multiplier as Segment["multiplier"] },
    name: t.segment.name,
    coords: t.coords,
    bouncer: t.bouncer,
  };
}

const sameSegment = (a: BoardThrow, b: BoardThrow) =>
  a.segment.name === b.segment.name && a.bouncer === b.bouncer;

const sameDart = (a: BoardThrow, b: BoardThrow) =>
  sameSegment(a, b) && a.coords.x === b.coords.x && a.coords.y === b.coords.y;

/**
 * Board events implied by moving from `prev` to `next`.
 *
 * Live: `next` is the very next WebSocket message, so a dart that changes in place is a revision.
 * Resync: `next` comes from `GET /api/state` after a reconnect and anything may have happened in
 * between; darts that no longer match mean the old visit was taken out.
 */
export function diffSnapshots(
  prev: BoardSnapshot,
  next: BoardSnapshot,
  mode: "live" | "resync",
): BoardEvent[] {
  const events: BoardEvent[] = [];
  if (prev.running !== next.running) {
    events.push({ type: next.running ? "BoardStarted" : "BoardStopped" });
  }
  if (next.status === "Takeout in progress" && prev.status !== "Takeout in progress") {
    events.push({ type: "TakeoutStarted" });
  }

  let known = prev.throws ?? [];
  const current = next.throws ?? [];
  if (mode === "live") {
    if (current.length < known.length) {
      events.push({ type: next.event === "Takeout finished" ? "TakeoutFinished" : "BoardReset" });
      known = [];
    }
    known.forEach((dart, i) => {
      const now = current[i];
      if (now && !sameSegment(dart, now)) events.push({ type: "DartRevised", ...toDart(i, now) });
    });
  } else if (current.length < known.length || known.some((d, i) => !sameDart(d, current[i] ?? d))) {
    if (known.length > 0) events.push({ type: "TakeoutFinished" });
    known = [];
  }

  for (let i = known.length; i < current.length; i++) {
    events.push({ type: "DartDetected", ...toDart(i, current[i] as BoardThrow) });
  }
  return events;
}

export function createBoardGateway(options: BoardGatewayOptions): BoardGateway {
  const base = options.url.replace(/\/$/, "");
  const minDelay = options.reconnectDelayMs ?? 500;
  const maxDelay = options.maxReconnectDelayMs ?? 10_000;
  const connectTimeoutMs = 5_000;

  let ws: WebSocket | null = null;
  let last: BoardSnapshot | null = null;
  let online = false;
  let closed = false;
  let delay = minDelay;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const emit = (events: BoardEvent[]) => {
    for (const event of events) options.onEvent(event);
  };

  function applyLive(next: BoardSnapshot) {
    if (last) emit(diffSnapshots(last, next, "live"));
    last = next;
  }

  async function sync() {
    const res = await fetch(`${base}/api/state`);
    if (!res.ok) throw new Error(`GET /api/state: ${res.status}`);
    const snapshot = (await res.json()) as BoardSnapshot;
    // The first snapshot is the baseline: darts already on the board aren't news.
    // After a reconnect, whatever changed while we were away is diffed in.
    const missed = last ? diffSnapshots(last, snapshot, "resync") : [];
    last = snapshot;
    online = true;
    delay = minDelay;
    emit([{ type: "BoardOnline", snapshot }, ...missed]);
  }

  function goOffline() {
    ws = null;
    if (online) {
      online = false;
      emit([{ type: "BoardOffline" }]);
    }
    if (closed) return;
    timer = setTimeout(connect, delay);
    delay = Math.min(delay * 2, maxDelay);
  }

  function connect() {
    if (closed) return;
    const socket = new WebSocket(`${base.replace(/^http/, "ws")}/api/events`);
    ws = socket;
    socket.addEventListener("open", () => {
      sync().catch(() => socket.close());
    });
    socket.addEventListener("message", (e) => {
      // Messages arriving before the sync's snapshot are dropped: they are almost always already
      // reflected in it. A change in the few milliseconds between the board answering the sync
      // and its response arriving would be missed until the next message; darts are seconds apart.
      if (!online) return;
      const message = JSON.parse(String(e.data));
      if (message.type === "state") applyLive(message.data as BoardSnapshot);
    });
    // A refused handshake can fire "error" without ever firing "close", leaving the socket stuck
    // in CONNECTING; so either event, or a connect timeout, abandons this socket.
    const abandon = () => {
      clearTimeout(connectTimer);
      if (ws === socket) goOffline();
    };
    const connectTimer = setTimeout(() => {
      if (socket.readyState === WebSocket.CONNECTING) abandon();
    }, connectTimeoutMs);
    socket.addEventListener("close", abandon);
    socket.addEventListener("error", abandon);
  }

  async function command(method: "PUT" | "POST", path: string) {
    const res = await fetch(`${base}/api/${path}`, { method });
    if (!res.ok) throw new Error(`${method} /api/${path}: ${res.status}`);
  }

  connect();

  return {
    get online() {
      return online;
    },
    start: () => command("PUT", "start"),
    stop: () => command("PUT", "stop"),
    reset: () => command("POST", "reset"),
    close() {
      closed = true;
      clearTimeout(timer);
      ws?.close();
    },
  };
}
