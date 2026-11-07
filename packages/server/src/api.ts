// Types shared with the web app, and the schemas requests are parsed with (src/parse.ts). The web
// app imports types only; nothing here may pull in Node modules.

import {
  type CricketVariant,
  type InRule,
  isSegment,
  MAX_LIVES,
  MAX_ROUNDS,
  type MatchSettings,
  type MatchState,
  type Mode,
  type OutRule,
  type PlayerMatchStats,
  type Segment,
  type StateOf,
  type X01Settings,
  type X01State,
} from "@n4/engine";
import { z } from "zod";
import type { TableRow } from "./tournaments/plan/groups.ts";
import type {
  Elimination,
  PhaseLegs,
  Placing,
  TournamentConfig,
  TournamentFormat,
} from "./tournaments/plan/types.ts";

export type { Placing, TableRow, TournamentConfig };

export interface MatchPlayer {
  id: string;
  name: string;
  /** Photo version, see `Player.photo`. */
  photo: string | null;
}

interface MatchViewOf<S extends MatchSettings> {
  id: string;
  /** In throwing order: index = the engine's `PlayerIndex`. */
  players: MatchPlayer[];
  settings: S;
  state: StateOf<S>;
  /** For tournament matches, e.g. "Group A · match 4". */
  label: string | null;
}

export type MatchView = {
  [M in Mode]: MatchViewOf<Extract<MatchSettings, { mode: M }>>;
}[Mode];
export type X01MatchView = MatchViewOf<X01Settings>;

/** A match as listed in /admin history; only X01 matches are listed. */
export interface MatchSummary {
  id: string;
  station: number | null;
  players: MatchPlayer[];
  settings: X01Settings;
  /** Player id; null while unfinished, when abandoned, or after a correction took the win away. */
  winner: string | null;
  abandoned: boolean;
  closedAt: string | null;
  /** Legs won per player, in throwing order. */
  legsWon: number[];
}

/** A match with every visit, for /admin; party matches only while they're live. */
export interface MatchDetail extends Omit<MatchSummary, "settings"> {
  settings: MatchSettings;
  state: MatchState;
  /** What the board first detected, for every dart that was corrected since. */
  originals: Record<string, Segment>;
  /** Darts the board missed that were added by hand on the station. */
  added: string[];
}

/** A finished X01 match as the stats pages show it: every leg and visit, no corrections. */
export type MatchPage = Omit<
  MatchDetail,
  "originals" | "added" | "station" | "settings" | "state"
> & {
  settings: X01Settings;
  state: X01State;
  /** Per player, in throwing order. */
  stats: PlayerMatchStats[];
  /** Where each player's board-detected darts landed (as on the profile). */
  landed: { x: number; y: number }[][];
};

export interface StationView {
  id: number;
  name: string;
  boardOnline: boolean;
  /** Detection is running; false after a stop (from the station's menu or the laptop). */
  boardRunning: boolean;
  takeout: boolean;
  /** Shown while there's no match, e.g. "Paused for the tournament". */
  notice: string | null;
  match: MatchView | null;
}

export interface Player {
  id: string;
  name: string;
  /** Hidden from pickers; their history stays. */
  archived: boolean;
  /** Version of the player's photo (for `/api/players/:id/photo?v=`); null without one. */
  photo: string | null;
  /** Shown by name on the public site; false shows them as "Player", without photo or profile. */
  public: boolean;
}

/** What the database needs to add or change a player; the photo is managed on its own. */
export type PlayerInput = Omit<Player, "photo" | "public"> & { public?: boolean };

/** A station as /admin manages it. */
export interface StationAdminView {
  id: number;
  name: string;
  boardUrl: string;
  boardOnline: boolean;
  boardRunning: boolean;
  /** Has a match (set up or running); can't be removed until it's closed. */
  busy: boolean;
}

/** A player as /admin lists them. */
export interface AdminPlayer extends Player {
  /** 3-dart average over the last 10 completed matches; null for an unseeded player. */
  rating: number | null;
}

/** Match moments a station's lights react to (wled-lights). */
export type LightEvent =
  | "matchStart"
  | "legWon"
  | "gameShot"
  | "s180"
  | "s100"
  | "bust"
  | "highCheckout";

/** A WLED controller on the LAN. */
export interface LightDevice {
  id: number;
  name: string;
  /** e.g. `http://192.168.1.50` */
  url: string;
}

/** The preset an event starts, and for how long before the station's base preset comes back. */
export interface EventLight {
  preset: number;
  seconds: number;
}

/** A station's lights: its device, its two base presets and what each event starts. */
export interface StationLights {
  stationId: number;
  deviceId: number | null;
  /** While the station has no match. */
  idlePreset: number | null;
  /** While a match is on. */
  playingPreset: number | null;
  events: Partial<Record<LightEvent, EventLight>>;
}

/** Admin → Lights: every device, and every station with its lights (empty ones too). */
export interface LightsAdminView {
  devices: LightDevice[];
  stations: (StationLights & { name: string })[];
}

/** What testing a device found: its name and presets, or why it couldn't be reached. */
export interface LightDeviceTest {
  name: string;
  version: string;
  presets: { id: number; name: string }[];
}

/** Whether this is the public site (public-stats), and whether this device has logged in. */
export interface PublicSession {
  public: boolean;
  authenticated: boolean;
}

export interface AdminSession {
  /** False when the server has no `ADMIN_PIN`: /admin is open. */
  pinRequired: boolean;
  authenticated: boolean;
}

const IN_RULES = {
  straight: "straight",
  double: "double",
  master: "master",
  bull: "bull",
} as const satisfies { [R in InRule]: R };

const OUT_RULES = {
  straight: "straight",
  double: "double",
  master: "master",
} as const satisfies { [R in OutRule]: R };

export const SegmentInput = z
  .custom<Segment>(isSegment, { error: "not a valid segment" })
  .transform(({ number, multiplier }): Segment => ({ number, multiplier }));

const START_SCORE = "start score must be a whole number of at least 2";
const LEGS_TO_WIN = "legs to win must be a whole number of at least 1";
const HOLES = "holes must be 9 or 18";
const CRICKET_VARIANTS = {
  standard: "standard",
  cutThroat: "cutThroat",
} as const satisfies { [V in CricketVariant]: V };
const LIVES = `lives must be a whole number from 1 to ${MAX_LIVES}`;
const ROUNDS = `rounds must be a whole number from 1 to ${MAX_ROUNDS}`;

/** What can be chosen when setting up an X01 match; the rules version is always the current one. */
export const X01SettingsInput = z.strictObject({
  mode: z.literal("x01"),
  startScore: z
    .number({ error: START_SCORE })
    .int({ error: START_SCORE })
    .min(2, { error: START_SCORE })
    .exactOptional(),
  inRule: z.enum(IN_RULES).exactOptional(),
  outRule: z.enum(OUT_RULES).exactOptional(),
  legsToWin: z
    .number({ error: LEGS_TO_WIN })
    .int({ error: LEGS_TO_WIN })
    .min(1, { error: LEGS_TO_WIN })
    .exactOptional(),
});

const withMode = (value: unknown) =>
  value !== null && typeof value === "object" && !("mode" in value)
    ? { ...value, mode: "x01" }
    : value;

export const MatchSettingsInput = z.preprocess(
  withMode,
  z.discriminatedUnion("mode", [
    X01SettingsInput,
    z.strictObject({
      mode: z.literal("aroundTheClock"),
      skipAhead: z.boolean().exactOptional(),
    }),
    z.strictObject({
      mode: z.literal("cricket"),
      variant: z.enum(CRICKET_VARIANTS).exactOptional(),
    }),
    z.strictObject({
      mode: z.literal("killer"),
      lives: z
        .number({ error: LIVES })
        .int({ error: LIVES })
        .min(1, { error: LIVES })
        .max(MAX_LIVES, { error: LIVES })
        .exactOptional(),
    }),
    z.strictObject({
      mode: z.literal("golf"),
      holes: z.union([z.literal(9), z.literal(18)], { error: HOLES }).exactOptional(),
      course: z.enum({ random: "random", inOrder: "inOrder" }).exactOptional(),
    }),
    z.strictObject({
      mode: z.literal("highScore"),
      rounds: z
        .number({ error: ROUNDS })
        .int({ error: ROUNDS })
        .min(1, { error: ROUNDS })
        .max(MAX_ROUNDS, { error: ROUNDS })
        .exactOptional(),
    }),
  ]),
);
export type MatchSettingsInput = z.infer<typeof MatchSettingsInput>;

const playerIds = z.array(z.string()).min(1);

export const StationCommand = z.discriminatedUnion("type", [
  /** Sets up a match on the station; it starts with `startMatch`. */
  z.strictObject({
    type: z.literal("quickMatch"),
    playerIds,
    settings: MatchSettingsInput.exactOptional(),
  }),
  /** Reorders the players of a match that hasn't started; the first one starts leg 1. */
  z.strictObject({ type: z.literal("setOrder"), playerIds }),
  z.strictObject({ type: z.literal("startMatch") }),
  z.strictObject({ type: z.literal("correctDart"), dartId: z.string(), segment: SegmentInput }),
  /** Adds a dart the board missed as the visit's next dart. */
  z.strictObject({ type: z.literal("addDart"), segment: SegmentInput }),
  z.strictObject({ type: z.literal("nextPlayer") }),
  z.strictObject({ type: z.literal("undo") }),
  /** Frees the station after the match is won. */
  z.strictObject({ type: z.literal("closeMatch") }),
  /** Ends the match without a result; one that never started is removed altogether. */
  z.strictObject({ type: z.literal("abandonMatch") }),
]);
export type StationCommand = z.infer<typeof StationCommand>;

/** A match the organiser puts on a station in /admin. */
export const NewMatchInput = z.strictObject({
  station: z.number().int(),
  playerIds,
  settings: MatchSettingsInput.exactOptional(),
});

/** The organiser's correction of a dart, in /admin. */
export const CorrectionInput = z.strictObject({ dartId: z.string(), segment: SegmentInput });

const ELIMINATIONS = {
  single: "single",
  double: "double",
} as const satisfies { [E in Elimination]: E };

const legsToWin = z.number().int().min(1).exactOptional();

/** A change to some of the tournament's settings; what's left out stays as it is. */
export const TournamentConfigPatch = z.strictObject({
  format: z
    .strictObject({
      groups: z.number().int().min(1).exactOptional(),
      advancePerGroup: z.number().int().min(1).nullable().exactOptional(),
      elimination: z.enum(ELIMINATIONS).exactOptional(),
      bracketReset: z.boolean().exactOptional(),
    } satisfies { [K in keyof TournamentFormat]: z.ZodType })
    .exactOptional(),
  legs: z
    .strictObject({
      groups: legsToWin,
      winners: legsToWin,
      losers: legsToWin,
      final: legsToWin,
    } satisfies { [K in keyof PhaseLegs]: z.ZodType })
    .exactOptional(),
  x01: X01SettingsInput.pick({ startScore: true, inRule: true, outRule: true }).exactOptional(),
} satisfies { [K in keyof TournamentConfig]: z.ZodType });
export type TournamentConfigPatch = z.infer<typeof TournamentConfigPatch>;

/** Drafting the tournament in /admin: creating it, or changing what may still change. */
export const TournamentInput = z.strictObject({
  name: z.string().exactOptional(),
  playerIds: z.array(z.string()).exactOptional(),
  config: TournamentConfigPatch.exactOptional(),
  /** Player ids in the organiser's seed order. */
  seedOrder: z.array(z.string()).exactOptional(),
});
export type TournamentInput = z.infer<typeof TournamentInput>;

/** A player withdrawing from the running tournament, or arriving late. */
export const TournamentPlayerInput = z.strictObject({ playerId: z.string() });
export const StationPauseInput = z.strictObject({ paused: z.boolean() });
export const MatchHoldInput = z.strictObject({ held: z.boolean() });
/** `null` lets the match go to any station. */
export const MatchPinInput = z.strictObject({ station: z.number().int().nullable() });
export const PlayNowInput = z.strictObject({ station: z.number().int() });

const PLAYER_NAME = "a player needs a name";

/** Trimmed, inner whitespace collapsed, not empty. */
const playerName = z
  .string({ error: PLAYER_NAME })
  .transform((name) => name.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(1, { error: PLAYER_NAME }));

export const NewPlayerInput = z.strictObject({ name: playerName });

export const PlayerChangesInput = z.strictObject({
  name: playerName.exactOptional(),
  archived: z.boolean().exactOptional(),
  public: z.boolean().exactOptional(),
});
export type PlayerChangesInput = z.infer<typeof PlayerChangesInput>;

const STATION_NUMBER = "the station number must be a whole number from 1";
const BOARD_URL = "the board address should look like http://192.168.1.139:3180";

/** A station added in /admin; without an id, it gets the number after the highest one. */
export const NewStationInput = z.strictObject({
  id: z
    .number({ error: STATION_NUMBER })
    .int({ error: STATION_NUMBER })
    .min(1, { error: STATION_NUMBER })
    .exactOptional(),
  name: z.string().exactOptional(),
  boardUrl: z.string({ error: BOARD_URL }),
});
export type NewStationInput = z.infer<typeof NewStationInput>;

export const StationChangesInput = z.strictObject({
  name: z.string().exactOptional(),
  boardUrl: z.string({ error: BOARD_URL }).exactOptional(),
});
export type StationChangesInput = z.infer<typeof StationChangesInput>;

/** The admin PIN, or the public site's password. */
export const PinInput = z.strictObject({ pin: z.string() });

/** The callout pack to use; `null` for the default voice. */
export const ActivePackInput = z.strictObject({
  id: z.string({ error: "Choose a pack, or null for the default voice." }).nullable(),
});

const LIGHT_EVENTS = {
  matchStart: "matchStart",
  legWon: "legWon",
  gameShot: "gameShot",
  s180: "s180",
  bust: "bust",
  highCheckout: "highCheckout",
  s100: "s100",
} as const satisfies { [E in LightEvent]: E };

export const LightEventInput = z.enum(LIGHT_EVENTS, {
  error: (issue) => `no such event: ${String(issue.input)}`,
});

/** How long an event's preset may run before the base preset comes back. */
export const MAX_LIGHT_SECONDS = 600;

const DEVICE_NAME = "a device needs a name";
const DEVICE_URL = "a device needs an address, e.g. 192.168.1.50";

const deviceName = z
  .string({ error: DEVICE_NAME })
  .transform((name) => name.trim())
  .pipe(z.string().min(1, { error: DEVICE_NAME }));

/** `http://` added when there's none, no trailing slash. */
const deviceUrl = z.string({ error: DEVICE_URL }).transform((value, ctx) => {
  const raw = value.trim();
  const url = /^https?:\/\//.test(raw) ? raw : `http://${raw}`;
  try {
    if (raw && new URL(url).hostname) return url.replace(/\/+$/, "");
  } catch {}
  ctx.issues.push({ code: "custom", message: DEVICE_URL, input: value });
  return z.NEVER;
});

export const NewLightDeviceInput = z.strictObject({ name: deviceName, url: deviceUrl });
export type NewLightDeviceInput = z.infer<typeof NewLightDeviceInput>;

export const LightDeviceChangesInput = z.strictObject({
  name: deviceName.exactOptional(),
  url: deviceUrl.exactOptional(),
});
export type LightDeviceChangesInput = z.infer<typeof LightDeviceChangesInput>;

const presetNumber = (what: string) => {
  const error = `${what} must be a preset number from 1 to 250`;
  return z.number({ error }).int({ error }).min(1, { error }).max(250, { error });
};

/** An event's preset and its seconds; `null` takes the event's light away. */
const eventLight = (event: LightEvent) => {
  const error = `${event} runs from 1 to ${MAX_LIGHT_SECONDS} seconds`;
  return z
    .strictObject({
      preset: presetNumber(`${event}'s preset`),
      seconds: z
        .number({ error })
        .int({ error })
        .min(1, { error })
        .max(MAX_LIGHT_SECONDS, { error }),
    })
    .nullable()
    .exactOptional();
};

const eventLights = z
  .strictObject(
    {
      matchStart: eventLight("matchStart"),
      legWon: eventLight("legWon"),
      gameShot: eventLight("gameShot"),
      s180: eventLight("s180"),
      bust: eventLight("bust"),
      highCheckout: eventLight("highCheckout"),
      s100: eventLight("s100"),
    } satisfies { [E in LightEvent]: z.ZodType },
    {
      error: (issue) =>
        issue.code === "unrecognized_keys"
          ? `no such event: ${issue.keys.join(", ")}`
          : "events must be an object",
    },
  )
  .transform((input) => {
    const out: Partial<Record<LightEvent, EventLight>> = {};
    for (const event of Object.values(LIGHT_EVENTS)) {
      const light = input[event];
      if (light) out[event] = light;
    }
    return out;
  });

const DEVICE_ID = "deviceId must be a device's id or null";

/** A change to a station's lights; what's left out stays, `events` replaces them all. */
export const StationLightsInput = z.strictObject({
  deviceId: z.number({ error: DEVICE_ID }).int({ error: DEVICE_ID }).nullable().exactOptional(),
  idlePreset: presetNumber("idle").nullable().exactOptional(),
  playingPreset: presetNumber("playing").nullable().exactOptional(),
  events: eventLights.exactOptional(),
});
export type StationLightsInput = z.infer<typeof StationLightsInput>;

export const LightTestInput = z.strictObject({ event: LightEventInput });

export const BoardActionInput = z.strictObject({
  action: z.enum(["start", "stop", "calibrate", "reset"], {
    error: "action must be start, stop, calibrate or reset",
  }),
});
export type BoardAction = z.infer<typeof BoardActionInput>["action"];

export interface TournamentEntrantView {
  playerId: string;
  name: string;
  /** 0 = top seed. */
  seed: number;
  group: number;
  withdrawn: boolean;
  photo: string | null;
  rating: number | null;
}

/** The active tournament as /admin shows it. */
export interface TournamentAdminView {
  tournament: {
    id: string;
    name: string;
    status: "draft" | "running" | "finished";
    config: TournamentConfig;
    startedAt: string | null;
    finishedAt: string | null;
  } | null;
  /** In seed order. */
  entrants: TournamentEntrantView[];
  /** Player ids per group. */
  groups: string[][];
  /** Whole tournament (draft) or what's left of it (running), in minutes. */
  estimateMinutes: number | null;
  /** Why it can't start yet; empty when it can. */
  problems: string[];
  /** Once started. */
  progress: TournamentProgress | null;
}

export interface TournamentMatchView {
  matchId: string | null;
  slot: string;
  label: string;
  /** Names; null while a knockout slot waits for an earlier result. */
  players: [string | null, string | null];
  /** The same players with their photos, for avatars. */
  sides: [MatchPlayer | null, MatchPlayer | null];
  /** Legs won, once played. */
  legs: [number, number] | null;
  winner: string | null;
  status: "waiting" | "queued" | "on-station" | "playing" | "played" | "walkover";
  station: number | null;
}

export interface QueueEntryView {
  matchId: string;
  label: string;
  players: MatchPlayer[];
  /** Both players free. */
  ready: boolean;
  held: boolean;
  pinnedStation: number | null;
}

export interface TournamentStationView {
  id: number;
  name: string;
  boardOnline: boolean;
  paused: boolean;
  match: {
    id: string;
    label: string | null;
    players: string[];
    started: boolean;
    /** E.g. "Ann 121 · Bob 301", "Ann won". */
    summary: string;
    remaining: number[] | null;
    winner: string | null;
  } | null;
}

export interface TournamentProgress {
  phase: "groups" | "knockout" | "finished";
  played: number;
  total: number;
  /** ISO time; null once finished. */
  expectedEnd: string | null;
  stations: TournamentStationView[];
  queue: QueueEntryView[];
  groups: {
    name: string;
    table: (TableRow & { name: string; photo: string | null })[];
    fixtures: TournamentMatchView[];
  }[];
  /** Knockout rounds, in order, once the groups are done. */
  bracket: {
    section: "winners" | "losers" | "final";
    name: string;
    matches: TournamentMatchView[];
  }[];
  placings: (MatchPlayer & { from: number; to: number })[] | null;
  /** The evening's awards, once finished with a champion; categories nobody scored in are left out. */
  awards: Award[] | null;
  /** Ended by the organiser before a champion. */
  endedEarly: boolean;
}

/** A finished tournament in the list of past ones. */
export interface PastTournamentSummary {
  id: string;
  name: string;
  /** ISO time it started. */
  date: string;
  /** Null when it was ended early. */
  champion: MatchPlayer | null;
}

/** A finished tournament's page: how it ended, and how it got there. */
export interface PastTournament extends PastTournamentSummary {
  endedEarly: boolean;
  placings: TournamentProgress["placings"];
  awards: TournamentProgress["awards"];
  groups: TournamentProgress["groups"];
  bracket: TournamentProgress["bracket"];
}

export interface Award {
  kind: "bestAverage" | "highestCheckout" | "most180s" | "bestLeg";
  /** The 3-dart average, the checkout, the number of 180s, or the darts in the leg. */
  value: number;
  /** Names; more than one on a tie. */
  players: string[];
}

/** A station's match in short, for the projector. */
export interface ScoreCard {
  matchId: string;
  mode: Mode;
  label: string | null;
  /** In throwing order. */
  players: (MatchPlayer & { legsWon: number; score: string })[];
  legsToWin: number;
  phase: MatchState["phase"];
  /** Whose visit it is, while the match is on. */
  throwing: number | null;
  /** The darts of the visit in progress. */
  visit: { segment: Segment; score: number; ignored: boolean }[];
  winner: number | null;
}

export interface DisplayStation {
  id: number;
  name: string;
  boardOnline: boolean;
  paused: boolean;
  match: ScoreCard | null;
}

/** What /display shows: the running or just finished tournament, or just the stations. */
export interface DisplayView {
  tournament: {
    name: string;
    phase: TournamentProgress["phase"];
    played: number;
    total: number;
    endedEarly: boolean;
  } | null;
  stations: DisplayStation[];
  /** The next queued matches. */
  upNext: { label: string; players: MatchPlayer[] }[];
  groups: TournamentProgress["groups"];
  bracket: TournamentProgress["bracket"];
  placings: TournamentProgress["placings"];
  awards: TournamentProgress["awards"];
  /** The leaderboard's top 10, while there's no tournament. */
  leaderboard: LeaderboardRow[];
}

/** A player's long-term numbers over their counted matches. */
export interface StatTotals {
  matches: number;
  matchesWon: number;
  legs: number;
  legsWon: number;
  average: number | null;
  first9Average: number | null;
  /** Share of darts at a one-dart finish that finished, in double-out matches; null without any. */
  checkoutPercent: number | null;
  checkoutAttempts: number;
  highestCheckout: number | null;
  /** Fewest darts in a won leg. */
  bestLeg: number | null;
  s180: number;
  s140: number;
  s100: number;
}

export interface LeaderboardRow {
  playerId: string;
  name: string;
  photo: string | null;
  /** 3-dart average over the last 10 counted matches. */
  rating: number | null;
  average: number | null;
  matches: number;
  matchesWon: number;
  s180: number;
  highestCheckout: number | null;
}

export interface PlayerProfile {
  playerId: string;
  name: string;
  photo: string | null;
  rating: number | null;
  /** Position on the leaderboard; null without a counted match. */
  rank: number | null;
  /** The day (YYYY-MM-DD) of the first counted match. */
  since: string | null;
  totals: StatTotals;
  /** One entry per day played (a session past midnight counts to the day it started), oldest first. */
  days: { day: string; average: number | null; matches: number }[];
  /** Finished tournaments the player was in, newest first. */
  tournaments: { id: string; name: string; date: string; from: number; to: number }[];
  tournamentsWon: number;
  /** The best finish, and the (latest) tournament it was in. */
  bestPlacing: { from: number; to: number; tournament: string } | null;
  /**
   * Where the player's last 500 board-detected darts landed, newest first: normalised board
   * coordinates (bull ≈ (0,0), double ring ≈ radius 0.95, `y` toward 20; misses beyond 1).
   */
  heatmap: { x: number; y: number }[];
  /** The last 20 counted matches, newest first. */
  recent: {
    matchId: string;
    date: string;
    opponents: string[];
    won: boolean;
    legsFor: number;
    /** The best opponent's legs. */
    legsAgainst: number;
    average: number | null;
  }[];
}

/** What a live stream shows, for /admin diagnostics. */
export type StreamKind =
  | "station"
  | "watch"
  | "display"
  | "admin tournament"
  | "stations"
  | "admin stations"
  | "match detail"
  | "match history"
  | "diagnostics"
  | "players"
  | "admin players"
  | "admin lights";

/** One board connection, for /admin diagnostics. */
export interface BoardDiagnostics {
  station: number;
  name: string;
  online: boolean;
  /** Times the connection was opened again since the server started. */
  reconnects: number;
  /** Seconds since the board last sent anything; null if it never has. */
  sinceMessageSeconds: number | null;
  /** The last reset, start or stop sent to the board, and how long it took to answer. */
  lastCommand: { name: string; ms: number; ok: boolean; at: string } | null;
  /** Messages from the board dropped because they didn't fit, and the last one's reason. */
  rejected: { count: number; last: { reason: string; at: string } | null };
}

export interface LightDiagnostics {
  device: string;
  sent: number;
  failed: number;
  /** The last failure: why, and when. */
  lastError: { message: string; at: string } | null;
}

/** GET /api/admin/diagnostics: whether the server keeps up (diagnostics ticket). */
export interface DiagnosticsView {
  startedAt: string;
  /** How long the event loop was blocked, over the last minute (or the `seconds` measured so far). */
  eventLoop: { seconds: number; p50Ms: number; p99Ms: number; maxMs: number };
  streams: {
    kind: StreamKind;
    /** E.g. "Station 1" or a match id. */
    label: string | null;
    client: string;
    userAgent: string;
    openSeconds: number;
    updates: number;
  }[];
  /** Per kind of stream, how long computing its view took, over the last minute. */
  views: { kind: StreamKind; perMinute: number; averageMs: number | null; maxMs: number | null }[];
  database: { writesPerMinute: number; slowestMs: number | null; slowestWrite: string | null };
  boards: BoardDiagnostics[];
  /** Calls to the WLED lights since the server started, per device; failures don't stop play. */
  lights: LightDiagnostics[];
  /** The last 20 darts: from the board's message to the station's streams, newest first. */
  darts: { station: number; name: string; ms: number; at: string }[];
  /** This request: whether it came through a proxy. */
  request: {
    client: string;
    host: string | null;
    proxied: boolean;
    headers: Record<string, string>;
  };
}

/** The active voice pack: every call key and the URLs of its recordings (variants). */
export type CallPack = Record<string, string[]>;

/** An uploaded voice pack, as /admin lists it. */
export interface CalloutPackView {
  id: string;
  name: string;
  uploadedAt: string;
  /** Call keys the pack has. */
  keys: number;
  files: number;
  /** Call keys it lacks; the default voice says those. */
  missing: string[];
}

export interface CalloutsAdminView {
  /** The active pack's id; null for the default voice. */
  active: string | null;
  /** False when the server has no data folder to keep packs in. */
  uploads: boolean;
  packs: CalloutPackView[];
}
