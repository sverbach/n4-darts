import type { MatchPage as Match } from "@n4/server/api";
import { SeriesChip } from "../../components/charts/SeriesChip.tsx";
import { MatchLegs } from "../../components/MatchLegs.tsx";
import { dartLabel } from "../../lib/darts.ts";
import { legScore } from "../../lib/format.ts";
import { matchRulesLabel } from "../../lib/labels.ts";
import { useFetch } from "../../lib/useFetch.ts";
import { date, SECTION, StatsFrame } from "./frame.tsx";
import { HeadToHead } from "./HeadToHead.tsx";
import { hasHeatmaps, MatchHeatmaps } from "./MatchHeatmaps.tsx";
import { ScoreRace } from "./ScoreRace.tsx";
import { Scoresheet } from "./Scoresheet.tsx";

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
  const legs = match.settings.legsToWin > 1;
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="kiosk:text-[40px] wrap-anywhere">
          {match.players.map((p) => p.name).join(" vs ")}
        </h1>
        <p className="hint m-0">
          {[
            winner ? `${winner.name} won` : "No winner",
            matchRulesLabel(match.settings),
            match.closedAt && date(match.closedAt),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {legs && (
          <p className="font-text m-0 text-[56px] leading-none tabular-nums">
            <span className="sr-only">Legs won </span>
            {legScore(match.legsWon)}
          </p>
        )}
      </header>
      <div className="kiosk:grid-cols-2 kiosk:items-stretch kiosk:gap-4 grid grid-cols-[minmax(0,1fr)] gap-6">
        <section className={SECTION}>
          <h2 className="label font-normal">Head-to-head</h2>
          <HeadToHead match={match} />
        </section>
        <section className={SECTION}>
          <h2 className="label font-normal">Score race</h2>
          <ScoreRace match={match} />
        </section>
      </div>
      {hasHeatmaps(match) && (
        <section className={SECTION}>
          <h2 className="label font-normal">Where the darts landed</h2>
          <MatchHeatmaps match={match} />
        </section>
      )}
      <section className={SECTION}>
        <h2 className="label font-normal">Every dart</h2>
        {match.players.length === 2 ? (
          <Scoresheet match={match} />
        ) : (
          <MatchLegs
            state={match.state}
            name={(i) => match.players[i]?.name ?? "?"}
            who={(i) => (
              <span className="flex items-baseline gap-2">
                <SeriesChip player={i} />
                <span className="label text-text break-words">{match.players[i]?.name}</span>
              </span>
            )}
            dart={(dart) => (
              <span
                key={dart.dartId}
                className={`inline-flex min-h-[46px] items-center justify-center border border-solid text-[26px] ${dart.ignored ? "border-border text-muted border-dashed line-through" : "border-border bg-surface"}`}
              >
                {dartLabel(dart.segment)}
              </span>
            )}
          />
        )}
      </section>
    </>
  );
}
