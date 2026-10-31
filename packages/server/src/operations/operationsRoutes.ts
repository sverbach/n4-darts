// The diagnostics page's data, in /admin: once, and as a stream while the page is open.

import type { FastifyInstance } from "fastify";
import type { BoardDiagnostics } from "../api.ts";
import { openEventStream } from "../live/liveRoutes.ts";
import type { StationDirectory } from "../stations/stations.ts";
import { diagnostics } from "./diagnostics.ts";

/** How often an open diagnostics page gets a new view. */
export const DIAGNOSTICS_REFRESH_MS = 2000;

export function registerDiagnostics(
  app: FastifyInstance,
  stations: StationDirectory,
  refreshMs = DIAGNOSTICS_REFRESH_MS,
) {
  const boards = (): BoardDiagnostics[] =>
    stations.list().map((station) => {
      const { id, name, boardOnline } = station.view();
      const stats = station.boardStats();
      return {
        station: id,
        name,
        online: boardOnline,
        reconnects: stats?.reconnects ?? 0,
        sinceMessageSeconds:
          stats?.lastMessageAt == null
            ? null
            : Math.round((Date.now() - stats.lastMessageAt) / 1000),
        lastCommand: stats?.lastCommand ?? null,
      };
    });

  app.get("/api/admin/diagnostics", async (request) => ({
    ...diagnostics.view(boards()),
    request: diagnostics.requestInfo(request),
  }));

  // The stream: one timer for every open page, so a second viewer costs no extra work. The view
  // is computed once per tick and sent to each page with that page's own request in front.
  const pages = new Set<(view: string) => void>();
  let timer: ReturnType<typeof setInterval> | undefined;
  let stopWatching: (() => void) | undefined;
  let last = "";
  const compute = () => {
    last = JSON.stringify(diagnostics.view(boards()));
    return last;
  };
  const tick = () => {
    const before = last;
    const view = compute();
    if (view === before) return;
    for (const send of pages) send(view);
  };

  app.get("/api/admin/diagnostics/live", (request, reply) => {
    const recorder = diagnostics.openStream("diagnostics", null, request);
    const events = openEventStream(request, reply);
    // `{"request":…,` and then the shared view without its opening brace.
    const own = `{"request":${JSON.stringify(diagnostics.requestInfo(request))},`;
    const send = (view: string) => {
      events.send(own + view.slice(1));
      recorder.sent();
    };
    if (pages.size === 0) {
      stopWatching = diagnostics.watch();
      timer = setInterval(tick, refreshMs);
      compute();
    }
    pages.add(send);
    send(last);
    events.onClose(() => {
      pages.delete(send);
      recorder.close();
      if (pages.size === 0) {
        clearInterval(timer);
        stopWatching?.();
      }
    });
  });

  app.addHook("onClose", async () => {
    clearInterval(timer);
    stopWatching?.();
  });
}
