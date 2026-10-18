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

  return (
    <main className="home">
      <h1>n4-darts</h1>
      <nav>
        <a href="/station/1">Station 1</a>
        <a href="/station/2">Station 2</a>
        <a href="/admin">Admin</a>
      </nav>
    </main>
  );
}
