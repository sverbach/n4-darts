import { useCallback, useEffect, useState } from "react";
import { call } from "./api.ts";

export interface Fetched<T> {
  /** The answer; null while loading or after an error. */
  data: T | null;
  loading: boolean;
  /** What went wrong, for the `error` pill; null when fine. */
  error: string | null;
  /** The HTTP status of a failed request (e.g. 404), null if the server wasn't reached. */
  status: number | null;
  /** Asks again, e.g. after a change the page doesn't follow live. */
  reload(): Promise<void>;
}

/**
 * Reads `url` once (and again when it changes): for what doesn't change while the page is open.
 * Anything that does is followed with `useLive` instead.
 */
export function useFetch<T>(url: string): Fetched<T> {
  const [state, setState] = useState<Omit<Fetched<T>, "reload">>({
    data: null,
    loading: true,
    error: null,
    status: null,
  });

  const load = useCallback(
    async (current: { stale: boolean }) => {
      const result = await call<T>("GET", url);
      if (current.stale) return;
      setState({ data: result.data, loading: false, error: result.error, status: result.status });
    },
    [url],
  );

  useEffect(() => {
    const current = { stale: false };
    setState((s) => ({ ...s, loading: true }));
    void load(current);
    return () => {
      current.stale = true;
    };
  }, [load]);

  const reload = useCallback(() => load({ stale: false }), [load]);
  return { ...state, reload };
}
