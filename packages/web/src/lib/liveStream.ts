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
  onFailed?(): void;
}

const CLOSED = 2;

export function followStream(
  url: string,
  handlers: StreamHandlers,
  env: { Source: new (url: string) => StreamSource; page: EventTarget } = {
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
