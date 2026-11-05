import { useEffect, useState } from "react";
import { followStream } from "./liveStream.ts";
import { beginLoading } from "./loading.ts";

export interface Live<T> {
  /** The latest view the server pushed; null until the first one arrives. */
  view: T | null;
  /** False while the connection to the server is down; it reconnects by itself. */
  connected: boolean;
  /** The server refused the stream (e.g. 4401: the admin PIN is needed); no more retries. */
  failed: boolean;
}

/** Follows a live view over a WebSocket: whole views (`streamView` on the server). */
export function useLive<T>(url: string | null): Live<T> {
  const [view, setView] = useState<T | null>(null);
  const [connected, setConnected] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url) return;
    setView(null);
    setFailed(false);
    const end = beginLoading();
    const stop = followStream(url, {
      onView: (v) => {
        end();
        setView(v as T);
      },
      onConnected: setConnected,
      onFailed: () => {
        end();
        setFailed(true);
      },
    });
    return () => {
      end();
      stop();
    };
  }, [url]);

  return { view, connected, failed };
}
