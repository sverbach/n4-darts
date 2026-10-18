import type { StationView } from "@n4/server/api";
import { useEffect, useState } from "react";
import { AdminPage, isAdminSection } from "./AdminPage.tsx";
import { StationPage } from "./StationPage.tsx";

export function App() {
  const path = window.location.pathname;
  const station = /^\/station\/(\d+)\/?$/.exec(path);
  if (station) return <StationPage id={Number(station[1])} />;
  const admin = /^\/admin(?:\/(\w+))?\/?$/.exec(path);
  if (admin) {
    const section = admin[1] ?? "players";
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
          <a key={s.id} href={`/station/${s.id}`}>
            {s.name}
          </a>
        ))}
        <a href="/admin">Admin</a>
      </nav>
    </main>
  );
}
