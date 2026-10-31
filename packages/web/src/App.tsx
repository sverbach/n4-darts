import type { StationView } from "@n4/server/api";
import { useEffect, useState } from "react";
import { Route, Switch } from "wouter";
import { SparkleLogo } from "./components/Logo.tsx";
import { PixelIcon } from "./components/PixelIcon.tsx";
import { AdminPage, isAdminSection } from "./features/admin/AdminPage.tsx";
import { DisplayPage } from "./features/display/DisplayPage.tsx";
import { StationPage } from "./features/station/StationPage.tsx";
import { LeaderboardPage, ProfilePage } from "./features/stats/StatsPages.tsx";
import { WatchPage } from "./features/watch/WatchPage.tsx";

/** A station number from the path; anything else isn't a station, so the page is home. */
const isNumber = (id: string) => /^\d+$/.test(id);

export function App() {
  return (
    <Switch>
      <Route path="/station/:id">
        {({ id }) => (isNumber(id) ? <StationPage id={Number(id)} /> : <Home />)}
      </Route>
      <Route path="/watch/:id">
        {({ id }) => (isNumber(id) ? <WatchPage id={Number(id)} /> : <Home />)}
      </Route>
      <Route path="/display" component={DisplayPage} />
      <Route path="/players" component={LeaderboardPage} />
      <Route path="/players/:id">{({ id }) => <ProfilePage id={id} />}</Route>
      <Route path="/admin/:section?">
        {({ section = "tournament" }) =>
          isAdminSection(section) ? <AdminPage section={section} /> : <Home />
        }
      </Route>
      <Route component={Home} />
    </Switch>
  );
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
      <h1 className="home-logo">
        <SparkleLogo />
      </h1>
      <div className="home-lists">
        <nav aria-label="Stations" className="home-list">
          <span className="label">Stations</span>
          {stations.map((s) => (
            <div key={s.id} className="home-station">
              <a href={`/station/${s.id}`} className="home-tile">
                <span className="home-tile-index">{String(s.id).padStart(2, "0")}</span>
                <span className="home-tile-name">{s.name}</span>
                <PixelIcon name="arrow" />
              </a>
              <a href={`/watch/${s.id}`} className="home-watch">
                Watch
              </a>
            </div>
          ))}
        </nav>
        <nav aria-label="More" className="home-list">
          <span className="label">More</span>
          {[
            ["/players", "Players and stats"],
            ["/display", "Display (projector)"],
            ["/admin", "Admin"],
          ].map(([href, text]) => (
            <a key={href} href={href} className="home-tile">
              <span className="home-tile-name">{text}</span>
              <PixelIcon name="arrow" />
            </a>
          ))}
        </nav>
      </div>
      <footer className="home-footer label">
        <span>n4-darts</span>
        <span>x01 · tournaments</span>
      </footer>
    </main>
  );
}
