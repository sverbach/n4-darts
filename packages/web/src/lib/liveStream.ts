export interface StreamSocket {
  readonly readyState: number;
  onopen: (() => void) | null;
  onclose: ((e: { code: number }) => void) | null;
  onmessage: ((e: { data: unknown }) => void) | null;
  close(): void;
}

export interface StreamHandlers {
  onView?(view: unknown): void;
  onConnected?(connected: boolean): void;
  onFailed?(): void;
}

export interface StreamEnv {
  Socket: new (url: string) => StreamSocket;
  location: { protocol: string; host: string };
  setTimeout(run: () => void, ms: number): unknown;
  clearTimeout(timer: unknown): void;
}

export const FIRST_RETRY_MS = 500;
export const MAX_RETRY_MS = 5000;

/** The server closes with 4000 + an HTTP status when it won't stream (docs/adr/0011). */
const isRefusal = (code: number) => code >= 4000 && code <= 4999;

const CONNECTING = 0;

function closeCleanly(socket: StreamSocket) {
  socket.onmessage = null;
  if (socket.readyState === CONNECTING) socket.onopen = () => socket.close();
  else socket.close();
}

const browser = (): StreamEnv => ({
  Socket: WebSocket as unknown as StreamEnv["Socket"],
  location: window.location,
  setTimeout: (run, ms) => window.setTimeout(run, ms),
  clearTimeout: (timer) => window.clearTimeout(timer as number),
});

/** Follows the live view at `path`, reconnecting until it's stopped or refused. */
export function followStream(
  path: string,
  handlers: StreamHandlers,
  env: StreamEnv = browser(),
): () => void {
  const scheme = env.location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${scheme}//${env.location.host}${path}`;
  let socket: StreamSocket | null = null;
  let retry: unknown = null;
  let delay = FIRST_RETRY_MS;
  let stopped = false;

  const open = () => {
    retry = null;
    const s = new env.Socket(url);
    s.onopen = () => {
      delay = FIRST_RETRY_MS;
      handlers.onConnected?.(true);
    };
    s.onmessage = (e) => {
      handlers.onConnected?.(true);
      handlers.onView?.(JSON.parse(String(e.data)));
    };
    s.onclose = (e) => {
      socket = null;
      if (stopped) return;
      handlers.onConnected?.(false);
      if (isRefusal(e.code)) {
        handlers.onFailed?.();
        return;
      }
      retry = env.setTimeout(open, delay);
      delay = Math.min(delay * 2, MAX_RETRY_MS);
    };
    socket = s;
  };

  open();
  return () => {
    stopped = true;
    if (retry !== null) env.clearTimeout(retry);
    if (socket) closeCleanly(socket);
    socket = null;
  };
}
