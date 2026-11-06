// The settings of a new quick match at the station; picking the players is PlayerPicker's.

import { type InRule, MAX_ROUNDS, MODES, type Mode, type OutRule } from "@n4/engine";
import type { MatchSettingsInput } from "@n4/server/api";
import { legsLabel, MODE_NAMES, roundsLabel } from "../../lib/labels.ts";

type X01Options = Required<Omit<Extract<MatchSettingsInput, { mode: "x01" }>, "mode">>;

export interface SetupSettings {
  mode: Mode;
  x01: X01Options;
  rounds: number;
}

export const defaultSetupSettings: SetupSettings = {
  mode: "x01",
  x01: { startScore: 301, inRule: "straight", outRule: "straight", legsToWin: 1 },
  rounds: 7,
};

export function settingsInput(setup: SetupSettings): MatchSettingsInput {
  switch (setup.mode) {
    case "x01":
      return { mode: "x01", ...setup.x01 };
    case "highScore":
      return { mode: "highScore", rounds: setup.rounds };
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
