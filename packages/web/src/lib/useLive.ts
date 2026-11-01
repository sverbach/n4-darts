import { useEffect, useState } from "react";
import { followStream } from "./liveStream.ts";

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
    // Closes while the page is hidden (e.g. kept in the back/forward cache): see liveStream.ts.
    return followStream(url, {
      onView: (v) => setView(v as T),
      onConnected: setConnected,
      onFailed: () => setFailed(true),
    });
  }, [url]);

  return { view, connected, failed };
}
