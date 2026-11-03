import type { TournamentMatchView, TournamentProgress } from "@n4/server/api";
import type { ReactNode } from "react";
import { average, legScore, placing } from "../lib/format.ts";
import { Avatar } from "./Avatar.tsx";
import { MatchCard, STATUS } from "./MatchCard.tsx";
import { PixelIcon } from "./PixelIcon.tsx";

type Group = TournamentProgress["groups"][number];
type Row = Group["table"][number];

/** The champion in brackets, then everyone else by place. */
export function Placings({ placings }: { placings: NonNullable<TournamentProgress["placings"]> }) {
  const champion = placings.find((p) => p.from === 1);
  return (
    <>
      {champion && (
        <div className="flex items-center gap-4 border border-border border-solid bg-panel px-6 kiosk:py-6 py-4 [--avatar:64px] kiosk:[--avatar:88px]">
          <span className="avatar-frame kiosk:text-[10px] text-[8px]">
            <Avatar player={champion} large />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="font-bold font-pixel text-[16px] text-accent uppercase tracking-[2px]">
              Champion
            </span>
            <span className="wrap-anywhere font-bold font-pixel kiosk:text-[28px] text-[22px] uppercase tracking-[3px]">
              {champion.name}
            </span>
          </div>
        </div>
      )}
      <ol className="m-0 list-none border-0 border-border border-t border-solid p-0">
        {placings
          .filter((p) => p !== champion)
          .map((p) => (
            <li
              key={p.id}
              className="flex min-h-[60px] items-center gap-4 border-0 border-line-soft border-b border-solid [--avatar:36px]"
            >
              <span className="min-w-14 whitespace-nowrap text-[32px] text-muted">
                {placing(p.from, p.to)}
              </span>
              <Avatar player={p} />
              <span className="font-pixel text-[16px] uppercase tracking-[1px]">{p.name}</span>
            </li>
          ))}
      </ol>
    </>
  );
}

/**
 * Each group's table and its played results. `actions` adds a last column (admin's withdraw);
 * `withdrawn` strikes a player through.
 */
export function GroupTables(props: {
  groups: Group[];
  actions?: ((row: Row) => ReactNode) | undefined;
  withdrawn?: ((playerId: string) => boolean) | undefined;
}) {
  const { groups, actions, withdrawn } = props;
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,480px),1fr))] gap-x-6 gap-y-4">
      {groups.map((group) => (
        <div key={group.name} className="flex min-w-0 flex-col gap-2">
          {groups.length > 1 && <span className="match-label">{group.name}</span>}
          <div className="scroll-x border border-border border-solid">
            <table className="group-table [--avatar:30px] [&_td:first-child]:pl-3 [&_td:first-child]:text-left [&_td:last-child]:pr-3 [&_td]:h-[52px] [&_td]:text-[24px] [&_th:first-child]:pl-3 [&_th:first-child]:text-left [&_th:last-child]:pr-3">
              <thead>
                <tr>
                  <th>#</th>
                  <th className="name">Player</th>
                  <th>P</th>
                  <th>W</th>
                  <th>L</th>
                  <th className="max-kiosk:hidden">Legs</th>
                  <th className="max-kiosk:hidden">+/−</th>
                  <th>Pts</th>
                  <th className="max-kiosk:hidden">Avg</th>
                  {actions && (
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {group.table.map((row, i) => (
                  <tr key={row.playerId}>
                    <td className="font-pixel text-[12px]! text-muted">{i + 1}</td>
                    <td
                      className={`name ${withdrawn?.(row.playerId) ? "text-muted line-through" : ""}`}
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <Avatar player={{ id: row.playerId, name: row.name, photo: row.photo }} />
                        {row.name}
                      </span>
                    </td>
                    <td>{row.played}</td>
                    <td>{row.won}</td>
                    <td>{row.lost}</td>
                    <td className="text-muted max-kiosk:hidden">
                      {legScore([row.legsFor, row.legsAgainst])}
                    </td>
                    <td className="max-kiosk:hidden">
                      {row.legDiff > 0 ? `+${row.legDiff}` : row.legDiff}
                    </td>
                    <td className="points">{row.points}</td>
                    <td className="text-muted max-kiosk:hidden">{average(row.average)}</td>
                    {actions && <td className="w-11">{actions(row)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {played(group.fixtures).length > 0 && (
            <details className="border border-line-soft border-solid">
              <summary className="px-3">
                <PixelIcon name="caret" /> Results ({played(group.fixtures).length})
              </summary>
              <ul>
                {played(group.fixtures).map((f) => (
                  <li key={f.slot}>
                    <span className="font-pixel text-[13px] uppercase">
                      {f.players[0]} <span className="text-muted">vs</span> {f.players[1]}
                    </span>
                    <span
                      className={
                        f.legs ? "text-[24px]" : "font-pixel text-[11px] text-muted uppercase"
                      }
                    >
                      {fixtureResult(f)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

/** The winners bracket and final in one row, the losers bracket in another; each scrolls sideways. */
export function BracketRows({ bracket }: { bracket: TournamentProgress["bracket"] }) {
  const top = bracket.filter((c) => c.section !== "losers");
  const losers = bracket.filter((c) => c.section === "losers");
  const rows = [
    { title: losers.length > 0 ? "Winners bracket" : "", columns: top },
    { title: "Losers bracket", columns: losers },
  ].filter((row) => row.columns.length > 0);
  return (
    <>
      {rows.map((row) => (
        <div key={row.title} className="flex flex-col gap-2.5">
          {row.title && <span className="match-label">{row.title}</span>}
          <div className="kiosk:scroll-x flex kiosk:flex-row flex-col gap-6 kiosk:pb-2 kiosk:[--fade-bg:var(--bg)]">
            {row.columns.map((column) => (
              <div
                key={`${column.section}-${column.name}`}
                className="flex kiosk:min-w-[260px] kiosk:flex-1 flex-col gap-3"
              >
                <h3 className="text-[11px]">{column.name}</h3>
                <div className="flex flex-1 flex-col justify-around gap-3">
                  {column.matches.map((m) => (
                    <MatchCard key={m.slot} match={m} round={column.name} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

const played = (fixtures: TournamentMatchView[]) =>
  fixtures.filter((f) => f.legs || f.status === "walkover");

function fixtureResult(f: TournamentMatchView) {
  if (f.legs) return `${legScore(f.legs)}${f.status === "walkover" ? " (w/o)" : ""}`;
  return STATUS[f.status];
}
