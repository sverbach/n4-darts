import type {
  EventLight,
  LightDevice,
  LightDeviceTest,
  LightEvent,
  LightsAdminView,
  StationLights,
} from "@n4/server/api";
import { type FormEvent, useEffect, useState } from "react";
import { ActionMenu } from "../../../components/ActionMenu.tsx";
import { PixelIcon } from "../../../components/PixelIcon.tsx";
import { call, request } from "../../../lib/api.ts";
import { useLive } from "../../../lib/useLive.ts";
import {
  CARD_DETAIL,
  CARD_LIST,
  CARD_MAIN,
  CARD_NAME,
  COLUMNS,
  cardActions,
  cardRow,
  cardTitle,
  MAIN,
  SECTION,
  STATUS_SMALL,
} from "../ui.ts";

const EVENTS: { event: LightEvent; label: string }[] = [
  { event: "matchStart", label: "Match start" },
  { event: "legWon", label: "Leg won" },
  { event: "gameShot", label: "Game shot" },
  { event: "s180", label: "180" },
  { event: "s100", label: "100+ visit" },
  { event: "bust", label: "Bust" },
  { event: "highCheckout", label: "High out (100+)" },
];
const DEFAULT_SECONDS = 5;
const BASE = "/api/admin/lights";

/** What a device's test found, by device id: its presets, or why it can't be reached. */
type Tests = Record<number, { result: LightDeviceTest } | { error: string } | undefined>;
type Change = (method: string, url: string, body?: object) => Promise<boolean>;

const FIELD_SMALL =
  "flex flex-col gap-2 font-pixel text-[11px] text-muted uppercase tracking-[1px] [&_input]:min-h-12 [&_input]:bg-bg [&_input]:text-[24px] [&_input]:text-text [&_input]:normal-case [&_input]:tracking-normal [&_select]:min-h-12 [&_select]:normal-case [&_select]:tracking-normal";

export function LightsAdmin() {
  const { view } = useLive<LightsAdminView>(`${BASE}/live`);
  const [error, setError] = useState<string | null>(null);
  const [tests, setTests] = useState<Tests>({});

  const change: Change = async (method, url, body) => {
    const message = await request(method, url, body);
    setError(message);
    return message === null;
  };

  const test = async (id: number) => {
    setTests((t) => ({ ...t, [id]: undefined }));
    const res = await call<LightDeviceTest>("POST", `${BASE}/devices/${id}/test`);
    setTests((t) => ({ ...t, [id]: res.data ? { result: res.data } : { error: res.error ?? "" } }));
  };

  // Each device used by a station is asked once for its presets, for the dropdowns.
  const used = [...new Set(view?.stations.flatMap((s) => (s.deviceId ? [s.deviceId] : [])))];
  const usedKey = used.join(",");
  // biome-ignore lint/correctness/useExhaustiveDependencies: asks again only when the devices in use change.
  useEffect(() => {
    for (const id of used) if (!(id in tests)) void test(id);
  }, [usedKey]);

  if (!view) return <p className="hint">Loading…</p>;
  return (
    <div className={COLUMNS}>
      <div className={MAIN}>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <section className={SECTION}>
          <h2>Stations</h2>
          {view.stations.length === 0 ? (
            <p className="hint">No stations yet.</p>
          ) : (
            <ul className={CARD_LIST}>
              {view.stations.map((s) => (
                <StationLightsCard
                  key={s.stationId}
                  station={s}
                  devices={view.devices}
                  tests={tests}
                  change={change}
                  onError={setError}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
      <section className="flex min-w-0 flex-[1_1_340px] flex-col gap-3">
        <h2>Devices</h2>
        {view.devices.length > 0 && (
          <ul className={CARD_LIST}>
            {view.devices.map((d) => (
              <DeviceCard
                key={d.id}
                device={d}
                test={tests[d.id]}
                tested={d.id in tests}
                onTest={() => test(d.id)}
                change={change}
              />
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-3 border border-border border-solid bg-panel p-6">
          <h3>Add a device</h3>
          <DeviceForm
            submitLabel="Add device"
            onSubmit={(name, url) => change("POST", `${BASE}/devices`, { name, url })}
          />
        </div>
      </section>
    </div>
  );
}

function DeviceCard(props: {
  device: LightDevice;
  test: Tests[number];
  tested: boolean;
  onTest(): void;
  change: Change;
}) {
  const { device, test, tested, onTest, change } = props;
  const [editing, setEditing] = useState(false);
  const url = `${BASE}/devices/${device.id}`;
  if (editing) {
    return (
      <li className={cardRow(true)}>
        <span className={CARD_NAME}>Edit {device.name}</span>
        <DeviceForm
          initial={device}
          submitLabel="Save"
          onCancel={() => setEditing(false)}
          onSubmit={async (name, address) => {
            const ok = await change("PATCH", url, { name, url: address });
            if (ok) setEditing(false);
            return ok;
          }}
        />
      </li>
    );
  }
  return (
    <li className={cardRow()}>
      <div className={CARD_MAIN}>
        <div className={cardTitle(true)}>
          <span className={CARD_NAME}>{device.name}</span>
          <ActionMenu
            label={`Actions for ${device.name}`}
            items={[
              { label: "Edit", run: () => setEditing(true) },
              {
                label: "Remove",
                danger: true,
                run: () => {
                  if (confirm(`Remove ${device.name}? Its stations keep their presets.`)) {
                    void change("DELETE", url);
                  }
                },
              },
            ]}
          />
        </div>
        <code className="wrap-anywhere font-text text-[22px] text-muted">{device.url}</code>
        {test && "result" in test && (
          <span className={`status status-ok ${STATUS_SMALL} self-start`}>
            {test.result.name} · {test.result.presets.length} presets
          </span>
        )}
        {test && "error" in test && (
          <span className={`${CARD_DETAIL} text-danger`} role="alert">
            {test.error}
          </span>
        )}
      </div>
      <div className={cardActions()}>
        <button type="button" onClick={onTest} disabled={tested && test === undefined}>
          {tested && test === undefined ? "Testing…" : "Test connection"}
        </button>
      </div>
    </li>
  );
}

function DeviceForm(props: {
  initial?: LightDevice;
  submitLabel: string;
  onSubmit(name: string, url: string): Promise<boolean>;
  onCancel?(): void;
}) {
  const [name, setName] = useState(props.initial?.name ?? "");
  const [url, setUrl] = useState(props.initial?.url ?? "");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if ((await props.onSubmit(name, url)) && !props.initial) {
      setName("");
      setUrl("");
    }
  };
  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <label className={FIELD_SMALL}>
        Name
        <input
          placeholder="Wall strip"
          value={name}
          required
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className={FIELD_SMALL}>
        Address
        <input
          placeholder="192.168.1.50"
          value={url}
          required
          inputMode="url"
          onChange={(e) => setUrl(e.target.value)}
        />
      </label>
      {props.onCancel ? (
        <div className={cardActions(true)}>
          <button type="submit" className="primary">
            {props.submitLabel}
          </button>
          <button type="button" className="ghost" onClick={props.onCancel}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="submit" className="primary cta min-h-14! text-[13px]!">
          {props.submitLabel} <PixelIcon name="arrow" height="0.9em" />
        </button>
      )}
    </form>
  );
}

function StationLightsCard(props: {
  station: StationLights & { name: string };
  devices: LightDevice[];
  tests: Tests;
  change: Change;
  onError(message: string | null): void;
}) {
  const { station, devices, tests, change, onError } = props;
  const url = `${BASE}/stations/${station.stationId}`;
  const save = (body: Partial<StationLights>) => change("PUT", url, body);
  const test = station.deviceId ? tests[station.deviceId] : undefined;
  const presets = test && "result" in test ? test.result.presets : null;
  const setEvent = (event: LightEvent, light: EventLight | null) =>
    save({ events: { ...station.events, [event]: light } as StationLights["events"] });

  return (
    <li className={cardRow()}>
      <div className="flex min-w-0 flex-[1_1_100%] flex-col gap-4">
        <span className={CARD_NAME}>{station.name}</span>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          <label className={FIELD_SMALL}>
            Device
            <select
              value={station.deviceId ?? ""}
              onChange={(e) => save({ deviceId: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">No lights</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          {station.deviceId !== null && (
            <>
              <PresetField
                label="Idle"
                value={station.idlePreset}
                presets={presets}
                onChange={(idlePreset) => save({ idlePreset })}
              />
              <PresetField
                label="Playing"
                value={station.playingPreset}
                presets={presets}
                onChange={(playingPreset) => save({ playingPreset })}
              />
            </>
          )}
        </div>
        {station.deviceId !== null && test && "error" in test && (
          <p className="hint m-0">Can't load the presets: {test.error}. Enter their numbers.</p>
        )}
        {station.deviceId !== null && (
          <ul className="m-0 flex list-none flex-col p-0" aria-label={`${station.name}'s events`}>
            {EVENTS.map(({ event, label }) => {
              const light = station.events[event];
              return (
                <li
                  key={event}
                  aria-label={label}
                  className="grid grid-cols-[minmax(0,1fr)_96px_auto] kiosk:grid-cols-[150px_minmax(0,1fr)_96px_auto] items-center gap-x-2 gap-y-1.5 border-0 border-line-soft border-b border-solid py-2"
                >
                  <span className="col-span-full kiosk:col-span-1 font-pixel text-[13px] uppercase">
                    {label}
                  </span>
                  <PresetSelect
                    label={`${label} preset`}
                    value={light?.preset ?? null}
                    presets={presets}
                    onChange={(preset) =>
                      setEvent(
                        event,
                        preset === null
                          ? null
                          : { preset, seconds: light?.seconds ?? DEFAULT_SECONDS },
                      )
                    }
                  />
                  <SecondsInput
                    label={`${label} seconds`}
                    value={light?.seconds ?? null}
                    onChange={(seconds) => light && setEvent(event, { ...light, seconds })}
                  />
                  <button
                    type="button"
                    className="min-h-12 px-3 text-[11px]"
                    disabled={!light}
                    onClick={async () => onError(await request("POST", `${url}/test`, { event }))}
                  >
                    Test
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </li>
  );
}

function PresetField(props: {
  label: string;
  value: number | null;
  presets: LightDeviceTest["presets"] | null;
  onChange(preset: number | null): void;
}) {
  return (
    <div className={FIELD_SMALL}>
      <span aria-hidden>{props.label}</span>
      <PresetSelect {...props} label={`${props.label} preset`} />
    </div>
  );
}

/** The device's presets to pick from; their numbers to type while they can't be loaded. */
function PresetSelect(props: {
  label: string;
  value: number | null;
  presets: LightDeviceTest["presets"] | null;
  onChange(preset: number | null): void;
}) {
  const { label, value, presets, onChange } = props;
  if (!presets) {
    return (
      <input
        aria-label={label}
        type="number"
        min={1}
        max={250}
        className="min-h-12 w-full bg-bg text-[24px]"
        defaultValue={value ?? ""}
        onBlur={(e) => {
          const next = e.target.value ? Number(e.target.value) : null;
          if (next !== value) onChange(next);
        }}
      />
    );
  }
  const known = value === null || presets.some((p) => p.id === value);
  return (
    <select
      aria-label={label}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
    >
      <option value="">None</option>
      {!known && <option value={value ?? ""}>{value} · not on the device</option>}
      {presets.map((p) => (
        <option key={p.id} value={p.id}>
          {p.id} · {p.name}
        </option>
      ))}
    </select>
  );
}

function SecondsInput(props: { label: string; value: number | null; onChange(s: number): void }) {
  const { label, value, onChange } = props;
  return (
    <span className="flex items-center gap-1.5">
      <input
        aria-label={label}
        type="number"
        min={1}
        max={600}
        disabled={value === null}
        className="min-h-12 w-full min-w-0 bg-bg text-[24px]"
        key={value ?? "none"}
        defaultValue={value ?? ""}
        onBlur={(e) => {
          const next = Number(e.target.value);
          if (next >= 1 && next <= 600 && next !== value) onChange(next);
        }}
      />
      <span className="label" aria-hidden>
        s
      </span>
    </span>
  );
}
