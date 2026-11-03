// The stations' match moments start their light presets (wled-lights): a game shot, a 180, a bust…
// start the event's preset for its seconds, then the station's base preset comes back (playing
// while a match is on, idle otherwise). Runs off the change feed, after a dart has been handled,
// and never waits for a device: a failure is counted in diagnostics (docs/adr/0009).

import type { MatchState, VisitView } from "@n4/engine";
import type { LightEvent, StationView } from "../api.ts";
import type { Db } from "../db.ts";
import type { ChangeFeed } from "../live/live.ts";
import { diagnostics } from "../operations/diagnostics.ts";
import type { StationDirectory } from "../stations/stations.ts";
import type { WledClient } from "./wled.ts";

/** When several happen at once, the first of these that has a preset runs. */
const PRIORITY: LightEvent[] = ["gameShot", "highCheckout", "legWon", "s180", "bust", "matchStart"];
const HIGH_CHECKOUT = 100;

interface Seen {
  matchId: string | null;
  started: boolean;
  legsWon: number;
  won: boolean;
  /** A visit's events that already fired, as `<first dart>:<event>`. */
  fired: Set<string>;
}

interface StationShow {
  seen: Seen;
  /** The event preset that's on, until its timer brings the base back. */
  event: ReturnType<typeof setTimeout> | null;
  /** What was last sent to the device, as `url#preset`; nothing is sent twice in a row. */
  sent: string | null;
}

const total = (visit: VisitView) =>
  visit.darts.reduce((sum, d) => sum + (d.ignored ? 0 : d.score), 0);

const allVisits = (state: MatchState) => [
  ...state.legs.flatMap((leg) => leg.visits),
  ...(state.currentVisit ? [state.currentVisit] : []),
];

/** The visits' own events in a match: a bust, a high checkout, a 180. */
function visitEvents(state: MatchState): { key: string; event: LightEvent }[] {
  return allVisits(state).flatMap((visit) => {
    const first = visit.darts[0]?.dartId;
    if (!first) return [];
    const event: LightEvent | null = visit.bust
      ? "bust"
      : visit.checkout && total(visit) >= HIGH_CHECKOUT
        ? "highCheckout"
        : visit.darts.length === 3 && total(visit) === 180
          ? "s180"
          : null;
    return event ? [{ key: `${first}:${event}`, event }] : [];
  });
}

export const seenOf = (match: StationView["match"]): Seen => ({
  matchId: match?.id ?? null,
  started: match ? match.state.phase !== "notStarted" : false,
  legsWon: match ? match.state.legs.filter((l) => l.winner !== null).length : 0,
  won: match ? match.state.winner !== null : false,
  fired: new Set(match ? visitEvents(match.state).map((v) => v.key) : []),
});

/** What happened between two looks at a station's match, most important first. */
export function eventsBetween(before: Seen, match: StationView["match"]): LightEvent[] {
  if (!match) return [];
  const same = before.matchId === match.id;
  const state = match.state;
  const events = new Set<LightEvent>();
  if ((!same || !before.started) && state.phase !== "notStarted") events.add("matchStart");
  if (same) {
    if (!before.won && state.winner !== null) events.add("gameShot");
    const legsWon = state.legs.filter((l) => l.winner !== null).length;
    if (legsWon > before.legsWon && state.winner === null) events.add("legWon");
    for (const { key, event } of visitEvents(state)) {
      if (!before.fired.has(key)) events.add(event);
    }
  }
  return PRIORITY.filter((e) => events.has(e));
}

export function startLightShow(
  db: Db,
  stations: StationDirectory,
  feed: ChangeFeed,
  wled: WledClient,
) {
  const shows = new Map<number, StationShow>();

  /** The event preset stays on for `seconds`, then the base comes back. */
  function runFor(show: StationShow, seconds: number) {
    if (show.event) clearTimeout(show.event);
    show.event = setTimeout(() => {
      show.event = null;
      show.sent = null;
      lookAll();
    }, seconds * 1000);
    show.event.unref?.();
  }

  function send(show: StationShow, url: string, preset: number) {
    show.sent = `${url}#${preset}`;
    wled.setPreset(url, preset).then(
      () => diagnostics.light(url),
      (error: unknown) => diagnostics.light(url, String((error as Error)?.message ?? error)),
    );
  }

  function look(stationId: number) {
    const station = stations.get(stationId);
    if (!station) return;
    const match = station.view().match;
    let show = shows.get(stationId);
    if (!show) {
      show = { seen: seenOf(match), event: null, sent: null };
      shows.set(stationId, show);
    }
    const lights = db.stationLights().find((l) => l.stationId === stationId);
    const device = lights?.deviceId
      ? db.lightDevices().find((d) => d.id === lights.deviceId)
      : undefined;

    const happened = eventsBetween(show.seen, match);
    show.seen = seenOf(match);
    if (!lights || !device) return;

    const event = happened.find((e) => lights.events[e]);
    const light = event ? lights.events[event] : undefined;
    if (light) {
      send(show, device.url, light.preset);
      runFor(show, light.seconds);
      return;
    }
    if (show.event) return;
    const playing = Boolean(match && match.state.phase !== "notStarted");
    const base = playing ? lights.playingPreset : lights.idlePreset;
    if (base !== null && show.sent !== `${device.url}#${base}`) send(show, device.url, base);
  }

  /** Lights never stop play: whatever goes wrong here is only counted. */
  const lookAll = () => {
    try {
      for (const station of stations.list()) look(station.id);
    } catch (error) {
      diagnostics.light("lights", String((error as Error)?.message ?? error));
    }
  };
  lookAll();
  const unsubscribe = feed.subscribe(lookAll);

  return {
    /** An event's preset was started by hand (Admin → Lights' test): the base comes back after it. */
    played(stationId: number, seconds: number) {
      const show = shows.get(stationId);
      if (!show) return;
      show.sent = null;
      runFor(show, seconds);
    },
    stop() {
      unsubscribe();
      for (const show of shows.values()) if (show.event) clearTimeout(show.event);
    },
  };
}

export type LightShow = ReturnType<typeof startLightShow>;
