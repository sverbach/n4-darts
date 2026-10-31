import type { AdminSession } from "@n4/server/api";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Logo } from "../../components/Logo.tsx";
import { PixelIcon } from "../../components/PixelIcon.tsx";
import { DiagnosticsAdmin } from "./diagnostics/DiagnosticsAdmin.tsx";
import { MatchesAdmin } from "./matches/MatchesAdmin.tsx";
import { PlayersAdmin } from "./players/PlayersAdmin.tsx";
import { StationsAdmin } from "./stations/StationsAdmin.tsx";
import { TournamentAdmin } from "./tournament/TournamentAdmin.tsx";
import { HEAD } from "./ui.ts";

/** The tournament tab heads itself, by its state; the others get a title and a line. */
const sections = {
  tournament: { title: "Tournament", blurb: "" },
  players: {
    title: "Players",
    blurb: "Everyone who can be picked for a match. Tap an avatar to change the photo.",
  },
  stations: { title: "Stations", blurb: "The dartboards in the room and how to reach them." },
  matches: { title: "Matches", blurb: "What's on each board, and every finished match." },
  diagnostics: {
    title: "Diagnostics",
    blurb: "Whether the server keeps up: for explaining a slow evening.",
  },
} as const;

export type AdminSection = keyof typeof sections;

/** A full-width error above the page: "Wrong PIN", "Server not reachable". */
const ALERT = "error justify-center! border-0! border-b-2! border-danger!";

export const isAdminSection = (value: string): value is AdminSection => value in sections;

export function AdminPage({ section }: { section: AdminSection }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session");
      setSession(await res.json());
    } catch {
      setError("Server not reachable");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    await refresh();
  };

  if (!session || !session.authenticated) {
    return (
      <main className="flex min-h-[100dvh] flex-col">
        {error && (
          <p className={ALERT} role="alert">
            {error}
          </p>
        )}
        {!session ? <p className="hint">Connecting…</p> : <Login onDone={refresh} />}
      </main>
    );
  }

  return (
    <div>
      <header className="border-0 border-border border-b border-solid">
        <div className="mx-auto kiosk:flex grid max-w-[1200px] grid-cols-[1fr_auto] items-center kiosk:gap-x-8 kiosk:gap-y-0 kiosk:px-8">
          <div className="flex kiosk:min-h-16 items-center gap-3 kiosk:gap-3.5 kiosk:p-0 px-4 py-2">
            <Logo width="72px" />
            <span className="font-pixel kiosk:text-[14px] text-[13px] uppercase tracking-[1px]">
              Admin
            </span>
          </div>
          <nav
            className="col-span-full row-start-2 flex kiosk:gap-1 overflow-x-auto border-0 border-border border-t kiosk:border-t-0 border-solid [scrollbar-width:none]"
            aria-label="Admin sections"
          >
            {Object.entries(sections).map(([key, { title }]) => (
              <a
                key={key}
                href={`/admin/${key}`}
                aria-current={key === section ? "page" : undefined}
                className="flex kiosk:min-h-16 min-h-[46px] flex-[1_0_auto] kiosk:flex-none items-center justify-center border-0 border-transparent border-b-2 border-solid kiosk:px-4 px-3 font-pixel kiosk:text-[12px] text-[10px] text-muted uppercase tracking-[1px] no-underline aria-[current=page]:border-accent aria-[current=page]:text-accent"
                // On a phone the row scrolls: keep the current tab in sight.
                ref={
                  key === section
                    ? (a) => a?.scrollIntoView({ block: "nearest", inline: "nearest" })
                    : undefined
                }
              >
                {title}
              </a>
            ))}
          </nav>
          {session.pinRequired && (
            <button
              type="button"
              className="kiosk:my-0 kiosk:mr-0 mr-4 kiosk:ml-auto border-0 bg-transparent p-0 kiosk:text-[12px] text-[11px] text-muted underline underline-offset-4"
              onClick={logout}
            >
              Log out
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto flex max-w-[1200px] flex-col gap-7 kiosk:gap-8 kiosk:px-8 px-4 kiosk:pt-10 pt-5 kiosk:pb-12 pb-7">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {section !== "tournament" && (
          <div className={HEAD}>
            <h1>{sections[section].title}</h1>
            <p className="hint">{sections[section].blurb}</p>
          </div>
        )}
        {section === "tournament" ? (
          <TournamentAdmin />
        ) : section === "players" ? (
          <PlayersAdmin />
        ) : section === "matches" ? (
          <MatchesAdmin />
        ) : section === "diagnostics" ? (
          <DiagnosticsAdmin />
        ) : (
          <StationsAdmin />
        )}
      </main>
    </div>
  );
}

function Login({ onDone }: { onDone: () => Promise<void> }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin }),
    }).catch(() => null);
    if (!res) return setError("Server not reachable");
    if (!res.ok) {
      setPin("");
      return setError("Wrong PIN");
    }
    await onDone();
  };

  return (
    <>
      {error && (
        <p className={ALERT} role="alert">
          {error}
        </p>
      )}
      <form
        className="m-auto flex w-[calc(100%_-_32px)] max-w-[440px] flex-col gap-3 border border-border border-solid bg-panel px-6 py-7"
        onSubmit={submit}
      >
        <Logo width="108px" className="mb-3 self-center" />
        <div className="mb-4 flex flex-col items-center gap-3">
          <h1 className="tracking-[5px]">Admin</h1>
          <span className="label">Enter PIN to unlock</span>
        </div>
        <label className="label" htmlFor="admin-pin">
          PIN
        </label>
        <input
          id="admin-pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          value={pin}
          required
          aria-invalid={error ? true : undefined}
          onChange={(e) => setPin(e.target.value)}
          className="min-h-[76px] border-2 bg-bg text-center text-[52px] tracking-[20px] aria-invalid:border-danger"
        />
        <button type="submit" className="primary cta min-h-16! text-[16px]!">
          Unlock <PixelIcon name="arrow" height="0.9em" />
        </button>
      </form>
    </>
  );
}
