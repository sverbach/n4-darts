// The settings of a new quick match at the station; picking the players is PlayerPicker's.

import type { InRule, OutRule } from "@n4/engine";
import type { MatchSettingsInput } from "@n4/server/api";
import { legsLabel } from "../../lib/labels.ts";

export type SetupSettings = Required<MatchSettingsInput>;

export const defaultSetupSettings: SetupSettings = {
  startScore: 301,
  inRule: "straight",
  outRule: "straight",
  legsToWin: 1,
};

export function SettingsFields(props: {
  value: SetupSettings;
  onChange(value: SetupSettings): void;
  playerCount: number;
}) {
  const { value, onChange, playerCount } = props;
  const set = <K extends keyof SetupSettings>(key: K, v: SetupSettings[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="settings">
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
    </div>
  );
}
