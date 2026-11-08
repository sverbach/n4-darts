import { type PlayerMatchStats, threeDartAverage } from "@n4/engine";
import type { MatchPage } from "@n4/server/api";
import { SeriesChip } from "../../components/charts/SeriesChip.tsx";
import { NONE } from "../../lib/format.ts";

type Better = "higher" | "lower" | null;

interface Row {
  label: string;
  values: (number | null)[];
  show: (value: number) => string;
  better: Better;
}

const one = (value: number) => value.toFixed(1);
const whole = (value: number) => String(value);

function rows(match: MatchPage): Row[] {
  const stats = match.stats;
  const pick = (f: (s: PlayerMatchStats) => number | null) => stats.map(f);
  const list: Row[] = [
    {
      label: "3\u2011dart avg",
      values: pick((s) => threeDartAverage([s])),
      show: one,
      better: "higher",
    },
    {
      label: "First 9",
      values: pick((s) => threeDartAverage([s.first9])),
      show: one,
      better: "higher",
    },
  ];
  if (match.settings.outRule === "double") {
    list.push({
      label: "Checkout %",
      values: pick((s) =>
        s.checkoutAttempts ? (s.checkoutHits / s.checkoutAttempts) * 100 : null,
      ),
      show: (v) => `${Math.round(v)}%`,
      better: "higher",
    });
  }
  list.push(
    { label: "High out", values: pick((s) => s.highestCheckout), show: whole, better: "higher" },
    { label: "Best leg", values: pick((s) => s.bestLeg), show: whole, better: "lower" },
    { label: "180s", values: pick((s) => s.s180), show: whole, better: "higher" },
    { label: "140+", values: pick((s) => s.s140), show: whole, better: "higher" },
    { label: "100+", values: pick((s) => s.s100), show: whole, better: "higher" },
    { label: "Darts", values: pick((s) => s.darts), show: whole, better: null },
  );
  return list;
}

function bestOf(values: (number | null)[], better: Better) {
  const known = values.filter((v): v is number => v !== null);
  if (!better || known.length === 0) return null;
  return better === "higher" ? Math.max(...known) : Math.min(...known);
}

export function HeadToHead({ match }: { match: MatchPage }) {
  const many = match.players.length > 2;
  const label = many ? "px-2" : "px-3";
  return (
    <div className="border-border bg-panel overflow-x-auto border border-solid">
      <table className="w-full border-collapse" aria-label="Head-to-head">
        <thead>
          <tr className="border-border border-0 border-b border-solid">
            <th className="bg-panel sticky left-0" />
            {match.players.map((p, i) => (
              <th
                key={p.id}
                scope="col"
                className={`kiosk:px-5 px-3 py-3 text-right align-bottom font-normal ${many ? "min-w-[72px]" : ""}`}
              >
                <span className="inline-flex items-baseline gap-2">
                  <SeriesChip player={i} />
                  <span className="font-pixel kiosk:text-[16px] text-[12px] tracking-[1px] break-words uppercase">
                    {p.name}
                  </span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows(match).map((row) => {
            const best = bestOf(row.values, row.better);
            return (
              <tr
                key={row.label}
                className="border-line-soft border-0 border-b border-solid last:border-b-0"
              >
                <th
                  scope="row"
                  className={`label bg-panel kiosk:px-5 sticky left-0 ${label} py-2.5 text-left font-normal ${many ? "kiosk:max-w-none kiosk:whitespace-nowrap max-w-[64px]" : "whitespace-nowrap"}`}
                >
                  {row.label}
                </th>
                {row.values.map((value, i) => (
                  <td
                    key={match.players[i]?.id ?? i}
                    className={`kiosk:px-5 font-text kiosk:text-[36px] py-2.5 text-right leading-none tabular-nums ${many ? "px-2 text-[22px]" : "px-3 text-[28px]"} ${value === null ? "text-faint" : best === null || value === best ? "text-text" : "text-muted"}`}
                  >
                    {value === null ? NONE : row.show(value)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
