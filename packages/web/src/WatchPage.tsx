import { MatchOver, Scoreboard } from "./StationPage.tsx";
import { useStation } from "./useStation.ts";

/** A station's scoreboard for the projector: live, with nothing to press. */
export function WatchPage({ id }: { id: number }) {
  const { view, connected } = useStation(id);
  const match = view?.match;

  return (
    <main className="watch">
      <header className="watch-bar">
        <span>{view?.name ?? `Station ${id}`}</span>
        {match?.label && <span className="match-label">{match.label}</span>}
        {!connected && <span className="status warn">Server offline</span>}
      </header>
      {!view ? (
        <p className="watch-note">Connecting…</p>
      ) : !match ? (
        <p className="watch-note">{view.notice ?? "Free"}</p>
      ) : match.state.phase === "notStarted" ? (
        <p className="watch-note">Next: {match.players.map((p) => p.name).join(" vs ")}</p>
      ) : match.state.phase === "matchWon" ? (
        <MatchOver match={match} />
      ) : (
        <Scoreboard match={match} />
      )}
    </main>
  );
}
