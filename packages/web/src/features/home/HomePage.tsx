// Home: where every device starts. Also shown for any path that isn't a page.

import { isX01Match } from "@n4/engine";
import type { StationView } from "@n4/server/api";
import { Link } from "wouter";
import { BoardStatus } from "../../components/BoardMenu.tsx";
import { SparkleLogo } from "../../components/Logo.tsx";
import { PixelIcon } from "../../components/PixelIcon.tsx";
import { matchRulesLabel } from "../../lib/labels.ts";
import { useLive } from "../../lib/useLive.ts";

const LIST = "flex min-w-0 flex-[1_1_420px] flex-col gap-2";
const FRAME = "border border-border border-solid bg-surface no-underline hover:border-accent-line";
const TILE = `flex min-h-[60px] min-w-0 flex-1 items-center justify-between gap-4 ${FRAME} px-4 font-pixel text-[16px] uppercase tracking-[1px] kiosk:min-h-[72px] kiosk:px-6 kiosk:text-[18px] [&_.pixel-icon]:h-[21px] [&_.pixel-icon]:text-muted`;

function stationState(station: StationView) {
  const match = station.match;
  if (!match) return station.notice ?? "Free";
  const names = match.players.map((p) => p.name).join(" vs ");
  const { state, players } = match;
  if (state.phase === "notStarted") return `${names} · waiting to start`;
  if (state.phase === "matchWon" && state.winner !== null) {
    return `${players[state.winner]?.name ?? "?"} won`;
  }
  if (!isX01Match(match)) return `${names} · ${matchRulesLabel(match.settings)}`;
  return `${names} · ${match.state.players.map((p) => p.remaining).join(" – ")}`;
}

/** The start page: the stations (followed live, so one added in /admin shows up), and the rest. */
export function HomePage() {
  const stations = useLive<StationView[]>("/api/stations/live").view ?? [];

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[1000px] flex-col gap-6 kiosk:gap-6 kiosk:px-6 px-4 kiosk:pt-6 pt-6 kiosk:pb-6 pb-6">
      <h1 className="flex justify-center pt-2 pb-3">
        {/* 3× the sprite's 76 pixels, so the logo itself stays 216 px wide. */}
        <SparkleLogo className="kiosk:w-[304px] w-[228px] max-w-[63vw]" />
      </h1>
      <div className="flex flex-wrap gap-x-6 gap-y-6">
        <nav aria-label="Stations" className={LIST}>
          <span className="label">Stations</span>
          {stations.map((s) => (
            <div key={s.id} className="flex gap-2">
              <Link href={`/station/${s.id}`} className={TILE}>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span>{s.name}</span>
                  {(s.match || s.notice) && (
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap font-text kiosk:text-[20px] text-[18px] text-muted uppercase tracking-normal">
                      {stationState(s)}
                    </span>
                  )}
                </span>
                {!s.match && !s.notice && (
                  <span className="status min-h-6! px-2! text-[11px]! before:size-1.5!">Free</span>
                )}
                <BoardStatus online={s.boardOnline} running={s.boardRunning} quiet />
                <PixelIcon name="arrow" />
              </Link>
              <Link
                href={`/watch/${s.id}`}
                className={`flex kiosk:w-[110px] w-[88px] items-center justify-center ${FRAME} font-pixel kiosk:text-[12px] text-[11px] text-text uppercase tracking-[1px] hover:text-accent`}
              >
                Watch
              </Link>
            </div>
          ))}
        </nav>
        <nav aria-label="More" className={LIST}>
          <span className="label">More</span>
          {(
            [
              ["/players", "Players and stats"],
              ["/display", "Projector"],
              ["/admin", "Admin"],
            ] as const
          ).map(([href, text]) => (
            <Link key={href} href={href} className={TILE}>
              <span className="flex-1">{text}</span>
              <PixelIcon name="arrow" />
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
