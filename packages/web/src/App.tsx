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

const LIST = "flex min-w-0 flex-[1_1_420px] flex-col gap-2";
const TILE =
  "flex min-h-[60px] flex-1 items-center justify-between gap-3.5 border border-border border-solid bg-surface px-4 font-pixel text-[15px] uppercase tracking-[1px] no-underline kiosk:min-h-[72px] kiosk:gap-4 kiosk:px-5 kiosk:text-[18px] [&_.pixel-icon]:h-[21px] [&_.pixel-icon]:text-accent";

function Home() {
  const [stations, setStations] = useState<StationView[]>([]);
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/stations").catch(() => null);
      if (res?.ok) setStations(await res.json());
    })();
  }, []);

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[1000px] flex-col gap-7 kiosk:gap-14 kiosk:px-8 px-4 kiosk:pt-[72px] pt-10 kiosk:pb-8 pb-6">
      <h1 className="flex justify-center pt-2 pb-3">
        {/* 3× the sprite's 76 pixels, so the logo itself stays 216 px wide. */}
        <SparkleLogo className="kiosk:w-[304px] w-[228px] max-w-[63vw]" />
      </h1>
      <div className="flex flex-wrap gap-x-8 gap-y-7">
        <nav aria-label="Stations" className={LIST}>
          <span className="label">Stations</span>
          {stations.map((s) => (
            <div key={s.id} className="flex gap-2">
              <a href={`/station/${s.id}`} className={TILE}>
                <span className="kiosk:text-[12px] text-[11px] text-muted">
                  {String(s.id).padStart(2, "0")}
                </span>
                <span className="flex-1">{s.name}</span>
                <PixelIcon name="arrow" />
              </a>
              <a
                href={`/watch/${s.id}`}
                className="flex kiosk:w-[110px] w-[88px] items-center justify-center border border-border border-solid font-pixel kiosk:text-[12px] text-[11px] text-muted uppercase tracking-[1px] no-underline hover:text-accent"
              >
                Watch
              </a>
            </div>
          ))}
        </nav>
        <nav aria-label="More" className={LIST}>
          <span className="label">More</span>
          {[
            ["/players", "Players and stats"],
            ["/display", "Display (projector)"],
            ["/admin", "Admin"],
          ].map(([href, text]) => (
            <a key={href} href={href} className={TILE}>
              <span className="flex-1">{text}</span>
              <PixelIcon name="arrow" />
            </a>
          ))}
        </nav>
      </div>
      <footer className="label mt-auto flex justify-between border-0 border-border border-t border-solid pt-3">
        <span>n4-darts</span>
        <span>x01 · tournaments</span>
      </footer>
    </main>
  );
}
