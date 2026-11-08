import type { DartView, VisitView } from "@n4/engine";
import type { MatchPage } from "@n4/server/api";
import { SeriesChip } from "../../components/charts/SeriesChip.tsx";
import { PixelIcon } from "../../components/PixelIcon.tsx";
import { dartLabel } from "../../lib/darts.ts";

const total = (visit: VisitView) =>
  visit.darts.reduce((sum, d) => sum + (d.ignored ? 0 : d.score), 0);

function Darts({ darts }: { darts: DartView[] }) {
  return (
    <span className="kiosk:gap-x-2 font-text kiosk:text-[20px] flex min-w-0 flex-wrap gap-x-1.5 gap-y-0.5 text-[16px]">
      {darts.map((d) => (
        <span key={d.dartId} className={d.ignored ? "text-muted line-through" : "text-text"}>
          {dartLabel(d.segment)}
        </span>
      ))}
    </span>
  );
}

function Cell({ visit }: { visit: VisitView | undefined }) {
  if (!visit) return <td className="kiosk:px-4 px-2 py-2" />;
  return (
    <td className="kiosk:px-4 px-2 py-2 align-top">
      <span className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2">
        <Darts darts={visit.darts} />
        <span
          className={`font-text kiosk:text-[26px] text-right text-[20px] whitespace-nowrap tabular-nums ${visit.bust ? "text-danger" : "text-text"}`}
        >
          {visit.bust ? "Bust" : total(visit)}
          {visit.checkout && (
            <span className="font-pixel text-muted ml-1.5 align-middle text-[11px] uppercase">
              Out
            </span>
          )}
        </span>
      </span>
    </td>
  );
}

export function Scoresheet({ match }: { match: MatchPage }) {
  const { state, players } = match;
  return state.legs.map((leg, l) => {
    const visits =
      l === state.legs.length - 1 && state.currentVisit
        ? [...leg.visits, state.currentVisit]
        : leg.visits;
    const rounds: (VisitView | undefined)[][] = [];
    const count = players.map(() => 0);
    for (const visit of visits) {
      const round = count[visit.player] ?? 0;
      count[visit.player] = round + 1;
      rounds[round] ??= players.map(() => undefined);
      (rounds[round] as (VisitView | undefined)[])[visit.player] = visit;
    }
    const starter = players[leg.starter]?.name ?? "?";
    const winner = leg.winner === null ? null : (players[leg.winner]?.name ?? "?");
    return (
      <details
        key={leg.visits[0]?.darts[0]?.dartId ?? `leg-${l}`}
        className="border-border bg-panel border border-solid"
        open={l === state.legs.length - 1}
      >
        <summary className="label kiosk:px-4 text-text flex min-h-11 cursor-pointer items-center gap-2 px-3">
          <PixelIcon name="caret" /> Leg {l + 1} · {starter} starts
          {winner && state.legs.length > 1 && ` · ${winner} won`}
        </summary>
        <table className="w-full table-fixed border-collapse" aria-label={`Leg ${l + 1}`}>
          <colgroup>
            <col className="kiosk:w-12 w-8" />
            {players.map((p) => (
              <col key={p.id} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-border border-0 border-t border-b border-solid">
              <th className="label kiosk:px-4 px-2 py-2 text-left font-normal">#</th>
              {players.map((p, i) => (
                <th key={p.id} scope="col" className="kiosk:px-4 px-2 py-2 text-left font-normal">
                  <span className="flex items-baseline gap-2">
                    <SeriesChip player={i} />
                    <span className="label text-text break-words">{p.name}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rounds.map((round, r) => (
              <tr
                // biome-ignore lint/suspicious/noArrayIndexKey: rounds are positions in the leg.
                key={r}
                className="border-line-soft border-0 border-b border-solid last:border-b-0"
              >
                <th
                  scope="row"
                  className="label kiosk:px-4 px-2 py-2 text-left align-top font-normal"
                >
                  {r + 1}
                </th>
                {round.map((visit, p) => (
                  <Cell key={players[p]?.id ?? p} visit={visit} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    );
  });
}
