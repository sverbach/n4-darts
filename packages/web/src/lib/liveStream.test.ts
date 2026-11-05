import { describe, expect, it } from "vitest";
import {
  FIRST_RETRY_MS,
  followStream,
  MAX_RETRY_MS,
  type StreamEnv,
  type StreamSocket,
} from "./liveStream.ts";

function fakeEnv(protocol = "http:") {
  const sockets: FakeSocket[] = [];
  const timers: { run: () => void; ms: number; cleared: boolean }[] = [];
  class FakeSocket implements StreamSocket {
    onopen: (() => void) | null = null;
    onclose: ((e: { code: number }) => void) | null = null;
    onmessage: ((e: { data: unknown }) => void) | null = null;
    closed = false;
    readonly url: string;
    constructor(url: string) {
      this.url = url;
      sockets.push(this);
    }
    close() {
      this.closed = true;
    }
  }
  const env: StreamEnv = {
    Socket: FakeSocket,
    location: { protocol, host: "darts.local:3000" },
    setTimeout: (run, ms) => {
      const timer = { run, ms, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimeout: (timer) => {
      (timer as { cleared: boolean }).cleared = true;
    },
  };
  const latest = () => sockets.at(-1) as FakeSocket;
  /** Runs the pending reconnect and returns its delay. */
  const elapse = () => {
    const timer = timers.at(-1);
    if (!timer || timer.cleared) throw new Error("no reconnect pending");
    timers.length = 0;
    timer.run();
    return timer.ms;
  };
  return { env, sockets, timers, latest, elapse };
}

describe("following a live stream", () => {
  it("opens a socket on the page's own host and passes on its views", () => {
    const { env, sockets, latest } = fakeEnv();
    const views: unknown[] = [];
    followStream("/api/x/live", { onView: (v) => views.push(v) }, env);
    latest().onmessage?.({ data: '{"n":1}' });
    expect(sockets.map((s) => s.url)).toEqual(["ws://darts.local:3000/api/x/live"]);
    expect(views).toEqual([{ n: 1 }]);
  });

  it("uses wss: on an https: page", () => {
    const { env, latest } = fakeEnv("https:");
    followStream("/api/x/live", {}, env);
    expect(latest().url).toBe("wss://darts.local:3000/api/x/live");
  });

  it("reconnects after a dropped connection, waiting longer each time up to a cap", () => {
    const { env, sockets, latest, elapse } = fakeEnv();
    const connected: boolean[] = [];
    followStream("/api/x/live", { onConnected: (c) => connected.push(c) }, env);
    latest().onopen?.();

    const delays: number[] = [];
    for (let i = 0; i < 6; i++) {
      latest().onclose?.({ code: 1006 });
      delays.push(elapse());
    }
    expect(delays).toEqual([FIRST_RETRY_MS, 1000, 2000, 4000, MAX_RETRY_MS, MAX_RETRY_MS]);
    expect(sockets).toHaveLength(7);
    expect(connected.slice(0, 2)).toEqual([true, false]);
  });

  it("starts from the first delay again once a connection opens", () => {
    const { env, latest, elapse } = fakeEnv();
    followStream("/api/x/live", {}, env);
    latest().onclose?.({ code: 1006 });
    elapse();
    latest().onclose?.({ code: 1006 });
    expect(elapse()).toBe(1000);
    latest().onopen?.();
    latest().onclose?.({ code: 1001 });
    expect(elapse()).toBe(FIRST_RETRY_MS);
  });

  it("gives up for good when the server refuses the stream", () => {
    const { env, sockets, timers, latest } = fakeEnv();
    let failed = false;
    followStream("/api/admin/x/live", { onFailed: () => (failed = true) }, env);
    latest().onclose?.({ code: 4401 });
    expect(failed).toBe(true);
    expect(timers).toHaveLength(0);
    expect(sockets).toHaveLength(1);
  });

  it("stopping cancels a pending reconnect", () => {
    const { env, timers, latest } = fakeEnv();
    const stop = followStream("/api/x/live", {}, env);
    latest().onclose?.({ code: 1006 });
    stop();
    expect(timers[0]?.cleared).toBe(true);
  });

  it("stopping closes the socket, and that close doesn't reconnect", () => {
    const { env, sockets, timers, latest } = fakeEnv();
    const connected: boolean[] = [];
    const stop = followStream("/api/x/live", { onConnected: (c) => connected.push(c) }, env);
    const socket = latest();
    stop();
    socket.onclose?.({ code: 1005 });
    expect(socket.closed).toBe(true);
    expect(timers).toHaveLength(0);
    expect(sockets).toHaveLength(1);
    expect(connected).toEqual([]);
  });
});
