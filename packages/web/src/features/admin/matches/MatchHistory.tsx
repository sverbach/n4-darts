import type { MatchSummary } from "@n4/server/api";
import type { ReactNode } from "react";
import { Link } from "wouter";
import { PixelIcon } from "../../../components/PixelIcon.tsx";
import { legScore } from "../../../lib/format.ts";
import { useLive } from "../../../lib/useLive.ts";
import { TABLE_PANEL } from "../ui.ts";

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" }) : "Not finished";
const time = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString(undefined, { timeStyle: "short" }) : "";

function winnerFirst(match: MatchSummary) {
  const order = match.players.map((_, i) => i);
  const w = match.players.findIndex((p) => p.id === match.winner);
  return w < 0 ? order : [w, ...order.filter((i) => i !== w)];
}

function score(match: MatchSummary) {
  if (match.abandoned) return "Abandoned";
  if (!match.winner) return match.walkover ? "Walkover" : "No winner";
  return legScore(winnerFirst(match).map((i) => match.legsWon[i] ?? 0));
}

function byDay(matches: MatchSummary[]) {
  const days = new Map<string, MatchSummary[]>();
  for (const m of matches) days.set(day(m.closedAt), [...(days.get(day(m.closedAt)) ?? []), m]);
  return [...days];
}

function Row(props: { href: string | null; className: string; children: ReactNode }) {
  const { href, className, children } = props;
  return href ? (
    <Link href={href} className={`${className} text-text no-underline hover:bg-surface`}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

export function MatchHistory() {
  const matches = useLive<MatchSummary[]>("/api/admin/matches/live").view;

  if (!matches) return <p className="hint">Loading…</p>;
  if (matches.length === 0) return <p className="hint">No finished matches yet.</p>;
  return (
    <div className={TABLE_PANEL}>
      <div className="label kiosk:grid hidden min-h-11 grid-cols-[minmax(0,1fr)_auto] kiosk:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_120px_24px] items-center gap-x-4 gap-y-1.5 border-0 border-border border-b border-solid px-6 kiosk:[&>span:nth-child(3)]:text-right">
        <span>Players</span>
        <span>Result</span>
        <span>Time</span>
      </div>
      {byDay(matches).map(([date, list]) => (
        <section key={date} aria-label={date}>
          <h3 className="m-0 border-0 border-line-soft border-b border-solid bg-surface kiosk:px-6 px-4 py-2">
            {date}
          </h3>
          <ul className="m-0 list-none p-0">
            {list.map((m) => (
              <li key={m.id} className="border-0 border-line-soft border-b border-solid">
                <Row
                  href={m.abandoned || m.walkover ? null : `/matches/${m.id}`}
                  className="grid min-h-[60px] w-full grid-cols-[minmax(0,1fr)_auto] kiosk:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_120px_24px] items-center gap-x-4 gap-y-1.5 border-0 bg-transparent kiosk:px-6 px-4 kiosk:py-0 py-2.5 text-left font-text normal-case tracking-normal kiosk:[&_.pixel-icon]:block [&_.pixel-icon]:hidden kiosk:[&_.pixel-icon]:h-[14px] kiosk:[&_.pixel-icon]:text-muted"
                >
                  <span className="font-pixel text-[13px] uppercase tracking-[1px]">
                    {winnerFirst(m).map((index, i) => {
                      const p = m.players[index];
                      if (!p) return null;
                      return (
                        <span key={p.id}>
                          {i > 0 && <span className="text-muted"> vs </span>}
                          <span className={m.winner && p.id !== m.winner ? "text-muted" : ""}>
                            {p.name}
                          </span>
                          {p.id === m.winner && <span className="sr-only"> (won)</span>}
                        </span>
                      );
                    })}
                  </span>
                  <span
                    className={`kiosk:row-auto row-start-2 kiosk:text-[24px] text-[22px] ${m.abandoned || !m.winner ? "text-muted" : ""}`}
                  >
                    {score(m)}
                  </span>
                  <span className="text-right font-pixel kiosk:text-[12px] text-[11px] text-muted [grid-column:2] [grid-row:1/span_2] kiosk:[grid-column:auto] kiosk:[grid-row:auto]">
                    {time(m.closedAt)}
                  </span>
                  {!m.abandoned && !m.walkover && <PixelIcon name="arrow" />}
                </Row>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
