// One live stream (Server-Sent Events) and the page's lifecycle.
//
// A page the user has left can stay alive in the back/forward cache, and with it its open
// streams. A browser has six connections per host (HTTP/1.1), so after a few clicks the kept
// pages' streams use them all and the next page waits until one is evicted (Brave: 27 s to over
// a minute in /admin). So a stream closes when its page is hidden (`pagehide`) and opens again
// if the page comes back from the cache (`pageshow` with `persisted`). The server pushes the
// whole view on connect, so nothing is missed in between.

/** What `followStream` needs of EventSource. */
export interface StreamSource {
  readonly readyState: number;
  onopen: (() => void) | null;
  onerror: (() => void) | null;
  onmessage: ((e: { data: string }) => void) | null;
  close(): void;
}

export interface StreamHandlers {
  onView?(view: unknown): void;
  onConnected?(connected: boolean): void;
  /** The stream answered with an error status (e.g. 401), so EventSource gave up. */
  onFailed?(): void;
}

/** `EventSource.CLOSED`: given up, rather than reconnecting. */
const CLOSED = 2;

/** Follows `url` until the returned function is called. */
export function followStream(
  url: string,
  handlers: StreamHandlers,
  env: { Source: new (url: string) => StreamSource; page: EventTarget } = {
    // EventSource's handlers take a MessageEvent; `StreamSource` asks only for its `data`.
    Source: EventSource as unknown as new (url: string) => StreamSource,
    page: window,
  },
): () => void {
  let source: StreamSource | null = null;

  const open = () => {
    const s = new env.Source(url);
    s.onopen = () => handlers.onConnected?.(true);
    s.onerror = () => {
      handlers.onConnected?.(false);
      if (s.readyState === CLOSED) handlers.onFailed?.();
    };
    s.onmessage = (e) => {
      handlers.onConnected?.(true);
      handlers.onView?.(JSON.parse(e.data));
    };
    source = s;
  };
  const close = () => {
    source?.close();
    source = null;
  };
  const onHide = () => close();
  const onShow = (e: Event) => {
    if ((e as PageTransitionEvent).persisted && !source) open();
  };

  open();
  env.page.addEventListener("pagehide", onHide);
  env.page.addEventListener("pageshow", onShow);
  return () => {
    env.page.removeEventListener("pagehide", onHide);
    env.page.removeEventListener("pageshow", onShow);
    close();
  };
}
