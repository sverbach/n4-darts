import { useEffect, useState } from "react";

export interface Live<T> {
  /** The latest view the server pushed; null until the first one arrives. */
  view: T | null;
  /** False while the connection to the server is down; EventSource keeps retrying. */
  connected: boolean;
  /** The stream answered with an error status (e.g. 401: the admin PIN is needed). */
  failed: boolean;
}

/** Follows a Server-Sent Events stream of whole views (`streamView` on the server). */
export function useLive<T>(url: string | null): Live<T> {
  const [view, setView] = useState<T | null>(null);
  const [connected, setConnected] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url) return;
    setView(null);
    setFailed(false);
    const source = new EventSource(url);
    source.onopen = () => setConnected(true);
    source.onerror = () => {
      setConnected(false);
      // EventSource gives up (CLOSED) on an error status rather than a dropped connection.
      if (source.readyState === EventSource.CLOSED) setFailed(true);
    };
    source.onmessage = (e) => {
      setConnected(true);
      setView(JSON.parse(e.data));
    };
    return () => source.close();
  }, [url]);

  return { view, connected, failed };
}
