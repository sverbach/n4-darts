import type { MatchPage } from "@n4/server/api";
import { useState } from "react";
import { RaceChart } from "../../components/charts/RaceChart.tsx";
import { SeriesChip } from "../../components/charts/SeriesChip.tsx";
import { raceOf } from "./race.ts";

export function ScoreRace({ match }: { match: MatchPage }) {
  const legs = match.state.legs.length;
  const [leg, setLeg] = useState(legs - 1);
  const race = raceOf(match.state, leg, match.settings.startScore, match.players.length);
  const name = (i: number) => match.players[i]?.name ?? "?";
  const lines = race.map((r) => ({ player: r.player, name: name(r.player), points: r.points }));

  return (
    <div className="flex flex-1 flex-col gap-2.5">
      {legs > 1 && (
        <fieldset className="m-0 flex flex-wrap gap-1.5 border-0 p-0">
          <legend className="sr-only">Leg</legend>
          {match.state.legs.map((l, i) => (
            <button
              type="button"
              key={l.visits[0]?.darts[0]?.dartId ?? i}
              aria-pressed={i === leg}
              onClick={() => setLeg(i)}
              className="min-h-10 px-3"
            >
              Leg {i + 1}
            </button>
          ))}
        </fieldset>
      )}
      <RaceChart
        lines={lines}
        start={match.settings.startScore}
        label={`Remaining score per visit, leg ${leg + 1}`}
        tooltip={(round) => (
          <>
            <span className="label">Visit {round}</span>
            {race.map((r) => {
              const p = r.points.find((q) => q.round === round);
              if (!p) return null;
              return (
                <span key={r.player} className="flex items-baseline gap-2">
                  <SeriesChip player={r.player} />
                  <span>
                    {name(r.player)} · {p.bust ? "Bust" : `${p.scored} scored`} · {p.left} left
                  </span>
                </span>
              );
            })}
          </>
        )}
      />
      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
        {match.players.map((p, i) => (
          <li key={p.id} className="flex items-baseline gap-2">
            <SeriesChip player={i} />
            <span className="label text-text">{p.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
