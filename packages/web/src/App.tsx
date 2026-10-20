import type { StationView } from "@n4/server/api";
import { useEffect, useState } from "react";
import { AdminPage, isAdminSection } from "./AdminPage.tsx";
import { DisplayPage } from "./DisplayPage.tsx";
import { StationPage } from "./StationPage.tsx";
import { LeaderboardPage, ProfilePage } from "./StatsPages.tsx";
import { WatchPage } from "./WatchPage.tsx";

export function App() {
  const path = window.location.pathname;
  const station = /^\/station\/(\d+)\/?$/.exec(path);
  if (station) return <StationPage id={Number(station[1])} />;
  if (/^\/display\/?$/.test(path)) return <DisplayPage />;
  if (/^\/players\/?$/.test(path)) return <LeaderboardPage />;
  const player = /^\/players\/([^/]+)\/?$/.exec(path);
  if (player) return <ProfilePage id={decodeURIComponent(player[1] as string)} />;
  const watch = /^\/watch\/(\d+)\/?$/.exec(path);
  if (watch) return <WatchPage id={Number(watch[1])} />;
  const admin = /^\/admin(?:\/(\w+))?\/?$/.exec(path);
  if (admin) {
    const section = admin[1] ?? "tournament";
    if (isAdminSection(section)) return <AdminPage section={section} />;
  }

  return <Home />;
}

function Home() {
  const [stations, setStations] = useState<StationView[]>([]);
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/stations").catch(() => null);
      if (res?.ok) setStations(await res.json());
    })();
  }, []);

  return (
    <main className="home">
      <h1>n4-darts</h1>
      <nav>
        {stations.map((s) => (
          <span key={s.id} className="home-station">
            <a href={`/station/${s.id}`}>{s.name}</a>
            <a href={`/watch/${s.id}`} className="home-watch">
              Watch
            </a>
          </span>
        ))}
        <a href="/players">Players and stats</a>
        <a href="/display">Display (projector)</a>
        <a href="/admin">Admin</a>
      </nav>
    </main>
  );
}
