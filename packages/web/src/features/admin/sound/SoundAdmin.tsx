import type { CalloutPackView, CalloutsAdminView } from "@n4/server/api";
import { type FormEvent, useState } from "react";
import { PixelIcon } from "../../../components/PixelIcon.tsx";
import { call } from "../../../lib/api.ts";
import { useFetch } from "../../../lib/useFetch.ts";
import {
  ASIDE,
  badge,
  CARD_LIST,
  CARD_MAIN,
  CARD_NAME,
  COLUMNS,
  cardActions,
  cardRow,
  MAIN,
} from "../ui.ts";

const MAX_MB = 50;
const CALLS = 184;

export function SoundAdmin() {
  const { data, error: loadError, reload } = useFetch<CalloutsAdminView>("/api/admin/callouts");
  const [error, setError] = useState<string | null>(null);

  const change = async (method: string, url: string, body?: object | Blob) => {
    const result = await call(method, url, body);
    setError(result.error);
    await reload();
    return result.error === null;
  };

  const use = (id: string | null) => change("PUT", "/api/admin/callouts/active", { id });

  return (
    <div className={COLUMNS}>
      <div className={MAIN}>
        {(error ?? loadError) && (
          <p className="error" role="alert">
            {error ?? loadError}
          </p>
        )}
        {!data ? (
          <p className="hint">Loading…</p>
        ) : (
          <ul className={CARD_LIST} aria-label="Voices">
            <Voice
              name="Default voice"
              detail={`All ${CALLS} calls · built in`}
              active={data.active === null}
              onUse={() => use(null)}
            />
            {data.packs.map((pack) => (
              <Voice
                key={pack.id}
                name={pack.name}
                detail={packDetail(pack)}
                active={data.active === pack.id}
                onUse={() => use(pack.id)}
                onDelete={() => {
                  if (confirm(`Delete ${pack.name}?`)) {
                    void change("DELETE", `/api/admin/callouts/${pack.id}`);
                  }
                }}
              />
            ))}
          </ul>
        )}
        <p className="hint m-0">
          Sound is switched on per device: in the station's board menu, or with the speaker button
          on /watch.
        </p>
      </div>
      {data?.uploads && (
        <section className={`${ASIDE} gap-3! border border-border border-solid bg-panel p-6`}>
          <h2>Upload a pack</h2>
          <Upload
            onUpload={(file) =>
              change(
                "POST",
                `/api/admin/callouts?name=${encodeURIComponent(file.name)}`,
                new Blob([file], { type: "application/zip" }),
              )
            }
            onTooBig={() => setError(`The pack is over ${MAX_MB} MB.`)}
          />
        </section>
      )}
    </div>
  );
}

function packDetail(pack: CalloutPackView) {
  const calls =
    pack.missing.length === 0
      ? `All ${CALLS} calls`
      : `${pack.keys} of ${CALLS} calls · the default voice says the rest`;
  return pack.files > pack.keys ? `${calls} · ${pack.files} recordings` : calls;
}

function Voice(props: {
  name: string;
  detail: string;
  active: boolean;
  onUse(): void;
  onDelete?(): void;
}) {
  return (
    <li className={cardRow()}>
      <div className={CARD_MAIN}>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className={CARD_NAME}>{props.name}</span>
          {props.active && <span className={badge("ok")}>In use</span>}
        </span>
        <span className="text-[20px] text-muted">{props.detail}</span>
      </div>
      <div className={cardActions()}>
        {!props.active && (
          <button type="button" onClick={props.onUse}>
            Use
          </button>
        )}
        {props.onDelete && (
          <button type="button" className="danger" onClick={props.onDelete}>
            Delete
          </button>
        )}
      </div>
    </li>
  );
}

function Upload(props: { onUpload(file: File): Promise<boolean>; onTooBig(): void }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState(0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) return props.onTooBig();
    setBusy(true);
    const ok = await props.onUpload(file);
    setBusy(false);
    if (ok) {
      setFile(null);
      setKey(key + 1);
    }
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <p className="hint m-0 text-[20px]">
        A zip in darts-caller's format: files named by call, like 60.mp3, gameshot.mp3,
        matchshot.mp3 and busted.mp3 (variants as gameshot+1.mp3). Other files are left out.
      </p>
      <input
        key={key}
        type="file"
        accept=".zip,application/zip"
        aria-label="Voice pack (zip)"
        required
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="min-h-0 border-0 bg-transparent p-0 text-[18px] text-muted file:mr-3 file:min-h-10 file:cursor-pointer file:border file:border-border file:border-solid file:bg-surface file:px-3 file:font-pixel file:text-[11px] file:text-text file:uppercase file:tracking-[1px]"
      />
      <p className="hint m-0 text-[20px]">
        Packs from other projects aren't ours to share: upload only what you may use.
      </p>
      <button type="submit" className="primary cta min-h-14! text-[13px]!" disabled={busy}>
        {busy ? "Uploading…" : "Upload pack"} <PixelIcon name="arrow" height="0.9em" />
      </button>
    </form>
  );
}
