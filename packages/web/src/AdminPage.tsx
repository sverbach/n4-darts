import type { AdminSession } from "@n4/server/api";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { MatchesAdmin } from "./MatchesAdmin.tsx";
import { PlayersAdmin } from "./PlayersAdmin.tsx";
import { StationsAdmin } from "./StationsAdmin.tsx";
import { TournamentAdmin } from "./TournamentAdmin.tsx";

const sections = {
  tournament: {
    title: "Tournament",
    blurb: "Tonight's tournament: set it up, start it, follow it.",
  },
  players: { title: "Players", blurb: "Add, rename and archive players." },
  stations: { title: "Stations", blurb: "Boards and their Board Manager addresses." },
  matches: { title: "Matches", blurb: "Create matches, put them on a station, see results." },
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

  return (
    <main className="admin">
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!session ? (
        <p className="hint">Connecting…</p>
      ) : !session.authenticated ? (
        <Login onDone={refresh} />
      ) : (
        <>
          <header className="admin-bar">
            <span className="admin-title">Admin</span>
            {session.pinRequired && (
              <button type="button" className="ghost" onClick={logout}>
                Log out
              </button>
            )}
          </header>
          <nav className="admin-nav">
            {Object.entries(sections).map(([key, { title }]) => (
              <a
                key={key}
                href={`/admin/${key}`}
                aria-current={key === section ? "page" : undefined}
              >
                {title}
              </a>
            ))}
          </nav>
          <section>
            <h1>{sections[section].title}</h1>
            <p className="hint">{sections[section].blurb}</p>
            {section === "tournament" ? (
              <TournamentAdmin />
            ) : section === "players" ? (
              <PlayersAdmin />
            ) : section === "matches" ? (
              <MatchesAdmin />
            ) : (
              <StationsAdmin />
            )}
          </section>
        </>
      )}
    </main>
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
    <form className="admin-login" onSubmit={submit}>
      <h1>Admin</h1>
      <input
        aria-label="PIN"
        placeholder="PIN"
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        value={pin}
        required
        onChange={(e) => setPin(e.target.value)}
      />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="primary">
        Unlock
      </button>
    </form>
  );
}
