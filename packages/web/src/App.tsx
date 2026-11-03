import { Redirect, Route, Switch } from "wouter";
import { AdminPage, isAdminSection } from "./features/admin/AdminPage.tsx";
import { DisplayPage } from "./features/display/DisplayPage.tsx";
import { HomePage as Home } from "./features/home/HomePage.tsx";
import { PublicGate } from "./features/public/PublicGate.tsx";
import { StationPage } from "./features/station/StationPage.tsx";
import { MatchPage } from "./features/stats/MatchPage.tsx";
import { LeaderboardPage, ProfilePage } from "./features/stats/StatsPages.tsx";
import { TournamentPage, TournamentsPage } from "./features/stats/TournamentPages.tsx";
import { WatchPage } from "./features/watch/WatchPage.tsx";
import { useNavigationEffects } from "./lib/navigation.ts";

/** A station number from the path; anything else isn't a station, so the page is home. */
const isNumber = (id: string) => /^\d+$/.test(id);

export function App() {
  useNavigationEffects();
  return <PublicGate room={<RoomPages />} site={<PublicPages />} />;
}

/** Everything, on the room's server. */
function RoomPages() {
  return (
    <Switch>
      <Route path="/station/:id">
        {({ id }) => (isNumber(id) ? <StationPage id={Number(id)} /> : <Home />)}
      </Route>
      <Route path="/watch/:id">
        {({ id }) => (isNumber(id) ? <WatchPage id={Number(id)} /> : <Home />)}
      </Route>
      <Route path="/display" component={DisplayPage} />
      {statsRoutes}
      <Route path="/admin/:section?">
        {({ section = "tournament" }) =>
          isAdminSection(section) ? <AdminPage section={section} /> : <Home />
        }
      </Route>
      <Route component={Home} />
    </Switch>
  );
}

/** The public site: the stats pages only; anything else goes to /players. */
function PublicPages() {
  return (
    <Switch>
      {statsRoutes}
      <Route>
        <Redirect to="/players" replace />
      </Route>
    </Switch>
  );
}

/** The stats pages, on both: an array, so `Switch` sees each route. */
const statsRoutes = [
  <Route key="players" path="/players" component={LeaderboardPage} />,
  <Route key="profile" path="/players/:id">
    {({ id }) => <ProfilePage id={id} />}
  </Route>,
  <Route key="tournaments" path="/tournaments" component={TournamentsPage} />,
  <Route key="tournament" path="/tournaments/:id">
    {({ id }) => <TournamentPage id={id} />}
  </Route>,
  <Route key="match" path="/matches/:id">
    {({ id }) => <MatchPage id={id} />}
  </Route>,
];
