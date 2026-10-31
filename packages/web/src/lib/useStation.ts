import type { StationCommand, StationView } from "@n4/server/api";
import { useCallback } from "react";
import { request } from "./api.ts";
import { useLive } from "./useLive.ts";

export interface StationConnection {
  view: StationView | null;
  /** False while the live connection to the server is down; EventSource keeps retrying. */
  connected: boolean;
  /** Sends a command; resolves to an error message, or null on success. */
  send(command: StationCommand): Promise<string | null>;
}

/** `watch`: a read-only screen (/watch), so diagnostics can tell it from the kiosk. */
export function useStation(id: number, options: { watch?: boolean } = {}): StationConnection {
  const query = options.watch ? "?view=watch" : "";
  const { view, connected } = useLive<StationView>(`/api/stations/${id}/live${query}`);

  const send = useCallback(
    (command: StationCommand) => request("POST", `/api/stations/${id}/commands`, command),
    [id],
  );

  return { view, connected, send };
}
