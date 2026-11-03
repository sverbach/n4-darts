import type { PublicSession } from "@n4/server/api";
import { type FormEvent, type ReactNode, useState } from "react";
import { Logo } from "../../components/Logo.tsx";
import { PixelIcon } from "../../components/PixelIcon.tsx";
import { call } from "../../lib/api.ts";
import { PublicSite } from "../../lib/publicSite.ts";
import { useFetch } from "../../lib/useFetch.ts";

const ALERT = "error justify-center! border-0! border-b-2! border-danger!";

/**
 * The room's pages on the room's server; on the public site (docs/adr/0008) the public pages,
 * once this device has the group's password.
 */
export function PublicGate(props: { room: ReactNode; site: ReactNode }) {
  const { data: session, error, reload } = useFetch<PublicSession>("/api/public/session");
  if (!session) {
    return error ? (
      <p className={ALERT} role="alert">
        {error}
      </p>
    ) : null;
  }
  if (!session.public) return props.room;
  if (!session.authenticated) return <PublicLogin onDone={reload} />;
  return <PublicSite.Provider value={true}>{props.site}</PublicSite.Provider>;
}

function PublicLogin({ onDone }: { onDone: () => Promise<void> }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await call("POST", "/api/public/login", { pin });
    if (result.status === null) return setError(result.error);
    if (result.error !== null) {
      setPin("");
      return setError("Wrong password");
    }
    await onDone();
  };

  return (
    <main className="flex min-h-[100dvh] flex-col">
      {error && (
        <p className={ALERT} role="alert">
          {error}
        </p>
      )}
      <form
        className="m-auto flex w-[calc(100%_-_32px)] max-w-[440px] flex-col gap-3 border border-border border-solid bg-panel px-6 py-6"
        onSubmit={submit}
      >
        <Logo width="108px" className="mb-3 self-center" />
        <div className="mb-4 flex flex-col items-center gap-3">
          <h1 className="tracking-[5px]">Stats</h1>
        </div>
        <label className="label" htmlFor="public-pin">
          Enter the group's password
        </label>
        <input
          id="public-pin"
          type="password"
          autoComplete="current-password"
          placeholder="••••"
          value={pin}
          required
          aria-invalid={error ? true : undefined}
          onChange={(e) => setPin(e.target.value)}
          className="min-h-[76px] border-2 bg-bg text-center text-[48px] tracking-[20px] aria-invalid:border-danger"
        />
        <button type="submit" className="primary cta min-h-16! text-[16px]!">
          Open <PixelIcon name="arrow" height="0.9em" />
        </button>
      </form>
    </main>
  );
}
