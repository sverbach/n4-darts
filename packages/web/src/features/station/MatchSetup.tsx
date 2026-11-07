// The settings of a new quick match at the station; picking the players is PlayerPicker's.

import {
  type CricketVariant,
  GOLF_HOLES,
  type GolfCourse,
  type GolfSettings,
  type InRule,
  MAX_LIVES,
  MAX_ROUNDS,
  MODES,
  type Mode,
  type OutRule,
} from "@n4/engine";
import type { MatchSettingsInput } from "@n4/server/api";
import { legsLabel, livesLabel, MODE_NAMES, roundsLabel } from "../../lib/labels.ts";

type X01Options = Required<Omit<Extract<MatchSettingsInput, { mode: "x01" }>, "mode">>;

export interface SetupSettings {
  mode: Mode;
  x01: X01Options;
  rounds: number;
  holes: GolfSettings["holes"];
  lives: number;
  variant: CricketVariant;
  skipAhead: boolean;
  course: GolfCourse;
}

export const defaultSetupSettings: SetupSettings = {
  mode: "x01",
  x01: { startScore: 301, inRule: "straight", outRule: "straight", legsToWin: 1 },
  rounds: 7,
  holes: 9,
  lives: 3,
  variant: "standard",
  skipAhead: false,
  course: "random",
};

export function settingsInput(setup: SetupSettings): MatchSettingsInput {
  switch (setup.mode) {
    case "x01":
      return { mode: "x01", ...setup.x01 };
    case "highScore":
      return { mode: "highScore", rounds: setup.rounds };
    case "golf":
      return { mode: "golf", holes: setup.holes, course: setup.course };
    case "killer":
      return { mode: "killer", lives: setup.lives };
    case "cricket":
      return { mode: "cricket", variant: setup.variant };
    case "aroundTheClock":
      return { mode: "aroundTheClock", skipAhead: setup.skipAhead };
    default:
      return { mode: setup.mode };
  }
}

export function SettingsFields(props: {
  value: SetupSettings;
  onChange(value: SetupSettings): void;
  playerCount: number;
}) {
  const { value, onChange } = props;
  const set = <K extends keyof X01Options>(key: K, v: X01Options[K]) =>
    onChange({ ...value, x01: { ...value.x01, [key]: v } });

  return (
    <div className="settings">
      <label className="[grid-column:1/-1]">
        Game
        <select
          value={value.mode}
          onChange={(e) => onChange({ ...value, mode: e.target.value as Mode })}
        >
          {MODES.map((mode) => (
            <option key={mode} value={mode}>
              {MODE_NAMES[mode]}
            </option>
          ))}
        </select>
      </label>
      {value.mode === "x01" && <X01Fields value={value.x01} set={set} />}
      {value.mode === "golf" && (
        <label>
          Course
          <select
            value={value.course}
            onChange={(e) => onChange({ ...value, course: e.target.value as GolfCourse })}
          >
            <option value="random">Random</option>
            <option value="inOrder">In order</option>
          </select>
        </label>
      )}
      {value.mode === "golf" && (
        <label>
          Holes
          <select
            value={value.holes}
            onChange={(e) =>
              onChange({ ...value, holes: Number(e.target.value) as GolfSettings["holes"] })
            }
          >
            {GOLF_HOLES.map((n) => (
              <option key={n} value={n}>
                {n} holes
              </option>
            ))}
          </select>
        </label>
      )}
      {value.mode === "aroundTheClock" && (
        <label>
          Doubles & trebles
          <select
            value={value.skipAhead ? "skip" : "once"}
            onChange={(e) => onChange({ ...value, skipAhead: e.target.value === "skip" })}
          >
            <option value="once">Count once</option>
            <option value="skip">Skip ahead</option>
          </select>
        </label>
      )}
      {value.mode === "cricket" && (
        <label>
          Points
          <select
            value={value.variant}
            onChange={(e) => onChange({ ...value, variant: e.target.value as CricketVariant })}
          >
            <option value="standard">Standard: most wins</option>
            <option value="cutThroat">Cut-throat: fewest wins</option>
          </select>
        </label>
      )}
      {value.mode === "killer" && (
        <label>
          Lives
          <select
            value={value.lives}
            onChange={(e) => onChange({ ...value, lives: Number(e.target.value) })}
          >
            {Array.from({ length: MAX_LIVES }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {livesLabel(n)}
              </option>
            ))}
          </select>
        </label>
      )}
      {value.mode === "highScore" && (
        <label>
          Rounds
          <select
            value={value.rounds}
            onChange={(e) => onChange({ ...value, rounds: Number(e.target.value) })}
          >
            {Array.from({ length: MAX_ROUNDS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {roundsLabel(n)}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

function X01Fields({
  value,
  set,
}: {
  value: X01Options;
  set: <K extends keyof X01Options>(key: K, v: X01Options[K]) => void;
}) {
  return (
    <>
      <label>
        Start
        <select
          value={value.startScore}
          onChange={(e) => set("startScore", Number(e.target.value))}
        >
          {[301, 501, 701].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label>
        In rule
        <select value={value.inRule} onChange={(e) => set("inRule", e.target.value as InRule)}>
          <option value="straight">Single</option>
          <option value="double">Double</option>
          <option value="master">Master</option>
          <option value="bull">Bull</option>
        </select>
      </label>
      <label>
        Out rule
        <select value={value.outRule} onChange={(e) => set("outRule", e.target.value as OutRule)}>
          <option value="straight">Single</option>
          <option value="double">Double</option>
          <option value="master">Master</option>
        </select>
      </label>
      <label>
        Legs
        <select value={value.legsToWin} onChange={(e) => set("legsToWin", Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {legsLabel(n)}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
