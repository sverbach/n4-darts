import { Route, Switch } from "wouter";
import { AdminPage, isAdminSection } from "./features/admin/AdminPage.tsx";
import { DisplayPage } from "./features/display/DisplayPage.tsx";
import { HomePage as Home } from "./features/home/HomePage.tsx";
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
