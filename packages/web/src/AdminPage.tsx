import type { AdminSession } from "@n4/server/api";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { DiagnosticsAdmin } from "./DiagnosticsAdmin.tsx";
import { Logo } from "./Logo.tsx";
import { MatchesAdmin } from "./MatchesAdmin.tsx";
import { PixelIcon } from "./PixelIcon.tsx";
import { PlayersAdmin } from "./PlayersAdmin.tsx";
import { StationsAdmin } from "./StationsAdmin.tsx";
import { TournamentAdmin } from "./TournamentAdmin.tsx";

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
      <main className="admin-login-page">
        {error && (
          <p className="error admin-alert" role="alert">
            {error}
          </p>
        )}
        {!session ? <p className="hint">Connecting…</p> : <Login onDone={refresh} />}
      </main>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-bar">
        <div className="admin-bar-inner">
          <div className="admin-id">
            <Logo width="72px" />
            <span className="admin-title">Admin</span>
          </div>
          <nav className="admin-nav" aria-label="Admin sections">
            {Object.entries(sections).map(([key, { title }]) => (
              <a
                key={key}
                href={`/admin/${key}`}
                aria-current={key === section ? "page" : undefined}
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
            <button type="button" className="admin-logout" onClick={logout}>
              Log out
            </button>
          )}
        </div>
      </header>
      <main className="admin">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {section !== "tournament" && (
          <div className="admin-head">
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
        <p className="error admin-alert" role="alert">
          {error}
        </p>
      )}
      <form className="admin-login" onSubmit={submit}>
        <Logo width="108px" />
        <div className="admin-login-head">
          <h1>Admin</h1>
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
        />
        <button type="submit" className="primary cta">
          Unlock <PixelIcon name="arrow" height="0.9em" />
        </button>
      </form>
    </>
  );
}
