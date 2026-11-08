import type { AdminSession } from "@n4/server/api";
import { type FormEvent, useState } from "react";
import { Link } from "wouter";
import { Logo } from "../../components/Logo.tsx";
import { PixelIcon } from "../../components/PixelIcon.tsx";
import { ThemeStar } from "../../components/ThemeStar.tsx";
import { call, request } from "../../lib/api.ts";
import { useFetch } from "../../lib/useFetch.ts";
import { DiagnosticsAdmin } from "./diagnostics/DiagnosticsAdmin.tsx";
import { LightsAdmin } from "./lights/LightsAdmin.tsx";
import { MatchesAdmin } from "./matches/MatchesAdmin.tsx";
import { PlayersAdmin } from "./players/PlayersAdmin.tsx";
import { SoundAdmin } from "./sound/SoundAdmin.tsx";
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
  sound: { title: "Sound", blurb: "The caller's voice on the stations and /watch." },
  lights: {
    title: "Lights",
    blurb:
      "The WLED light strips: which station each one lights, and what a match's moments start.",
  },
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
  const { data: session, error, reload: refresh } = useFetch<AdminSession>("/api/admin/session");

  const logout = async () => {
    await request("POST", "/api/admin/logout");
    await refresh();
  };

  if (!session?.authenticated) {
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
      <header>
        <div className="kiosk:flex kiosk:gap-x-6 kiosk:gap-y-0 kiosk:px-6 mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)_auto] items-center">
          <div className="kiosk:min-h-16 kiosk:gap-3 kiosk:p-0 flex items-center gap-3 px-4 py-2">
            <Logo width="72px" />
            <span className="font-pixel kiosk:text-[13px] text-[13px] tracking-[1px] uppercase">
              Admin
            </span>
            <ThemeStar side="right" />
          </div>
          <nav
            className="scroll-x kiosk:gap-1.5 border-border kiosk:border-t-0 col-span-full row-start-2 flex min-w-0 [scrollbar-width:none] border-0 border-t border-solid [--fade-bg:var(--bg)]"
            aria-label="Admin sections"
          >
            {Object.entries(sections).map(([key, { title }]) => (
              <Link
                key={key}
                href={`/admin/${key}`}
                aria-current={key === section ? "page" : undefined}
                className="kiosk:min-h-16 kiosk:flex-none kiosk:px-4 font-pixel kiosk:text-[12px] text-muted aria-[current=page]:border-accent aria-[current=page]:text-accent flex min-h-[46px] flex-[1_0_auto] items-center justify-center border-0 border-b-2 border-solid border-transparent px-3 text-[11px] tracking-[1px] uppercase no-underline"
                // On a phone the row scrolls: keep the current tab in sight.
                ref={
                  key === section
                    ? (a) => a?.scrollIntoView({ block: "nearest", inline: "center" })
                    : undefined
                }
              >
                {title}
              </Link>
            ))}
          </nav>
          {session.pinRequired && (
            <button
              type="button"
              className="kiosk:my-0 kiosk:mr-0 kiosk:ml-auto kiosk:text-[12px] text-muted mr-4 border-0 bg-transparent p-0 text-[11px] underline underline-offset-4"
              onClick={logout}
            >
              Log out
            </button>
          )}
        </div>
      </header>
      <main className="kiosk:gap-6 kiosk:px-6 kiosk:pt-6 kiosk:pb-6 mx-auto flex max-w-[1200px] flex-col gap-6 px-4 pt-6 pb-6">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {section !== "tournament" && section !== "matches" && (
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
          <MatchesAdmin
            head={
              <div className={HEAD}>
                <h1>{sections.matches.title}</h1>
                <p className="hint">{sections.matches.blurb}</p>
              </div>
            }
          />
        ) : section === "sound" ? (
          <SoundAdmin />
        ) : section === "lights" ? (
          <LightsAdmin />
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
    const result = await call("POST", "/api/admin/login", { pin });
    if (result.status === null) return setError(result.error);
    if (result.error !== null) {
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
        className="border-border bg-panel m-auto flex w-[calc(100%_-_32px)] max-w-[440px] flex-col gap-3 border border-solid px-6 py-6"
        onSubmit={submit}
      >
        <div className="mb-3 flex items-center justify-center gap-2">
          <Logo width="108px" />
          <ThemeStar side="right" />
        </div>
        <div className="mb-4 flex flex-col items-center gap-3">
          <h1 className="tracking-[5px]">Admin</h1>
        </div>
        <label className="label" htmlFor="admin-pin">
          Enter the PIN to unlock
        </label>
        <input
          id="admin-pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          placeholder="••••"
          value={pin}
          required
          aria-invalid={error ? true : undefined}
          onChange={(e) => setPin(e.target.value)}
          className="bg-bg aria-invalid:border-danger min-h-[76px] border-2 text-center text-[48px] tracking-[20px]"
        />
        <button type="submit" className="primary cta min-h-16! text-[16px]!">
          Unlock <PixelIcon name="arrow" height="0.9em" />
        </button>
      </form>
    </>
  );
}
