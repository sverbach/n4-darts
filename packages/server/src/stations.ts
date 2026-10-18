import { type BoardGatewayOptions, createBoardGateway } from "./board/gateway.ts";
import type { Db } from "./db.ts";
import { createStation, type Station } from "./station.ts";

export interface StationConfig {
  id: number;
  /** Board Manager base URL, e.g. `http://192.168.1.139:3180`. */
  boardUrl: string;
}

/** Parses `STATIONS`, e.g. `1=http://192.168.1.139:3180,2=http://192.168.1.140:3180`. */
export function parseStationsConfig(value: string): StationConfig[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [id, boardUrl] = entry.split("=");
      if (!id || !boardUrl || !Number.isInteger(Number(id))) {
        throw new Error(`STATIONS entry "${entry}" should look like 1=http://host:3180`);
      }
      return { id: Number(id), boardUrl };
    });
}

export interface RunningStation {
  station: Station;
  close(): void;
}

/** A station wired to its board. */
export function startStation(
  config: StationConfig,
  db: Db,
  gatewayOptions: Partial<BoardGatewayOptions> = {},
): RunningStation {
  const station = createStation({
    id: config.id,
    db,
    board: { reset: () => gateway.reset() },
  });
  const gateway = createBoardGateway({
    ...gatewayOptions,
    url: config.boardUrl,
    onEvent: (event) => station.handleBoardEvent(event),
  });
  return { station, close: () => gateway.close() };
}
