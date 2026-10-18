import { StationPage } from "./StationPage.tsx";

export function App() {
  const station = /^\/station\/(\d+)\/?$/.exec(window.location.pathname);
  if (station) return <StationPage id={Number(station[1])} />;

  return (
    <main className="home">
      <h1>n4-darts</h1>
      <nav>
        <a href="/station/1">Station 1</a>
        <a href="/station/2">Station 2</a>
      </nav>
    </main>
  );
}
