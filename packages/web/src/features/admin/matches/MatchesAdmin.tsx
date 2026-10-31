import type { StationView } from "@n4/server/api";
import { type ReactNode, useState } from "react";
import { BoardStatus } from "../../../components/BoardMenu.tsx";
import { request } from "../../../lib/api.ts";
import { useLive } from "../../../lib/useLive.ts";
import { CARD_NAME, cardActions, cardTitle, RULED, SECTION } from "../ui.ts";
import { MatchDetailView, MatchHistory } from "./MatchHistory.tsx";

/** The stations and the history; a match's detail replaces both, and the page's `head`. */
export function MatchesAdmin({ head }: { head: ReactNode }) {
  const stations = useLive<StationView[]>("/api/stations/live").view;
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const abandon = async (station: StationView) => {
    if (!confirm(`End the match on ${station.name} without a result?`)) return;
    setError(await request("POST", `/api/admin/stations/${station.id}/abandon`));
  };

  if (openId) return <MatchDetailView id={openId} onBack={() => setOpenId(null)} />;

  return (
    <div className="flex flex-col gap-7 kiosk:gap-8">
      {head}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <section className={SECTION}>
        <h2>Stations</h2>
        {!stations ? (
          <p className="hint">Loading…</p>
        ) : (
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 p-0">
            {stations.map((s) => (
              <StationRow
                key={s.id}
                station={s}
                onAbandon={() => abandon(s)}
                onOpen={() => s.match && setOpenId(s.match.id)}
              />
            ))}
          </ul>
        )}
      </section>
      <section className={RULED}>
        <h2>History</h2>
        <MatchHistory onOpen={setOpenId} />
      </section>
    </div>
  );
}

function StationRow(props: { station: StationView; onAbandon(): void; onOpen(): void }) {
  const { station, onAbandon, onOpen } = props;
  const { match } = station;
  return (
    <li className="flex flex-col gap-3 border border-border border-solid bg-panel px-[18px] py-4">
      <div className={cardTitle(true)}>
        <a className={CARD_NAME} href={`/station/${station.id}`}>
          {station.name}
        </a>
        <BoardStatus
          online={station.boardOnline}
          running={station.boardRunning}
          quiet
          className="min-h-[26px]! px-2! text-[10px]!"
        />
      </div>
      <span className={`wrap-anywhere text-[26px] ${match ? "" : "hint"}`}>
        {match ? matchSummary(match) : "Free"}
      </span>
      {match && (
        <div className={`${cardActions(true)} mt-auto`}>
          {match.state.phase !== "notStarted" && (
            <button type="button" onClick={onOpen}>
              Details
            </button>
          )}
          <button type="button" className="danger" onClick={onAbandon}>
            {match.state.phase === "notStarted" ? "Cancel match" : "End match"}
          </button>
        </div>
      )}
    </li>
  );
}

function matchSummary(match: NonNullable<StationView["match"]>) {
  const { state, players } = match;
  const name = (i: number) => players[i]?.name ?? "?";
  if (state.phase === "notStarted") {
    return `${players.map((p) => p.name).join(", ")}: waiting to start`;
  }
  if (state.phase === "matchWon" && state.winner !== null) return `${name(state.winner)} won`;
  return state.players
    .map(
      (p, i) => `${name(i)} ${p.remaining}${match.settings.legsToWin > 1 ? ` (${p.legsWon})` : ""}`,
    )
    .join(" · ");
}
