// Following a live view from a test, as a browser would: a WebSocket to the listening app.

export interface Closed {
  code: number;
  reason: string;
}

export interface LiveClient<T> {
  /** The next view the server sends; rejects if the socket closes first. */
  next(): Promise<T>;
  /** How the socket closed, once it has. */
  closed: Promise<Closed>;
  close(): Promise<Closed>;
}

/** `url` may be http:; it's opened as ws:. */
export function openLive<T = unknown>(
  url: string,
  headers: Record<string, string> = {},
): LiveClient<T> {
  const socket = new WebSocket(url.replace(/^http/, "ws"), { headers });
  const queued: T[] = [];
  const waiting: { resolve: (view: T) => void; reject: (error: Error) => void }[] = [];
  let ended: Closed | null = null;

  const closed = new Promise<Closed>((resolve) => {
    socket.onclose = (event) => {
      ended = { code: event.code, reason: event.reason };
      for (const waiter of waiting.splice(0)) {
        waiter.reject(new Error(`socket closed: ${ended.code} ${ended.reason}`));
      }
      resolve(ended);
    };
  });
  socket.onmessage = (event) => {
    const view = JSON.parse(String(event.data)) as T;
    const waiter = waiting.shift();
    if (waiter) waiter.resolve(view);
    else queued.push(view);
  };

  return {
    next() {
      const view = queued.shift();
      if (view !== undefined) return Promise.resolve(view);
      if (ended) return Promise.reject(new Error(`socket closed: ${ended.code}`));
      return new Promise((resolve, reject) => waiting.push({ resolve, reject }));
    },
    closed,
    close() {
      socket.close();
      return closed;
    },
  };
}
