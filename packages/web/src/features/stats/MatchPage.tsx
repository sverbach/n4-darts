import type { MatchPage as Match } from "@n4/server/api";
import { MatchLegs } from "../../components/MatchLegs.tsx";
import { dartLabel } from "../../lib/darts.ts";
import { legScore } from "../../lib/format.ts";
import { matchRulesLabel } from "../../lib/labels.ts";
import { useFetch } from "../../lib/useFetch.ts";
import { date, StatsFrame } from "./frame.tsx";

/** /matches/:id: a finished match, leg by leg and dart by dart. */
export function MatchPage({ id }: { id: string }) {
  const { data: match, error, status } = useFetch<Match>(`/api/matches/${encodeURIComponent(id)}`);
  return (
    <StatsFrame back={["/players", "Players"]}>
      {error ? (
        <p className="error" role="alert">
          {status === 404 ? "No such match" : `Couldn't load the match: ${error}`}
        </p>
      ) : !match ? (
        <p className="hint">Loading…</p>
      ) : (
        <MatchView match={match} />
      )}
    </StatsFrame>
  );
}

function MatchView({ match }: { match: Match }) {
  const winner = match.players.find((p) => p.id === match.winner);
  const legs = match.settings.legsToWin > 1 ? ` ${legScore(match.legsWon)}` : "";
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="wrap-anywhere kiosk:text-[40px]">
          {match.players.map((p) => p.name).join(" vs ")}
        </h1>
        <p className="hint m-0">
          {[
            winner ? `${winner.name} won${legs}` : "No winner",
            matchRulesLabel(match.settings),
            match.closedAt && date(match.closedAt),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <MatchLegs
        state={match.state}
        name={(i) => match.players[i]?.name ?? "?"}
        dart={(dart) => (
          <span
            key={dart.dartId}
            className={`inline-flex min-h-[46px] items-center justify-center border border-solid text-[26px] ${dart.ignored ? "border-border border-dashed text-muted line-through" : "border-border bg-surface"}`}
          >
            {dartLabel(dart.segment)}
          </span>
        )}
      />
    </>
  );
}
